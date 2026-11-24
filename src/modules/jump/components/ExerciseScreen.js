import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Accelerometer } from "expo-sensors";
import Clinometer from "./clinometer/Clinometer";
import { Ionicons } from "@expo/vector-icons";
import ExerciseInstructions from "./ExerciseInstructions";
import EvaluationMeasurementBlock from "../../../components/EvaluationMeasurementBlock";
import { useEvaluationCommands } from "../../../hooks/useEvaluationCommands";
import accelerationArrays from "../auxiliaries/accelerationArrays";
import WeightSelector from "./selectors/WeightSelector";
import { highPassFilter } from "../auxiliaries/cmj_Auxiliaries/filtros/highPassFilter";
import { removeUpwardPeaksMulti } from "../auxiliaries/cmj_Auxiliaries/removeUpwardPeaksMulti";
import jumpProcess from "../auxiliaries/jumpProcess";
import { useAuth } from "../../../auth/AuthContext";
import usePlanModuleConfig from "../../../hooks/usePlanModuleConfig";
import useCmjLiveSocket from "../hooks/useCmjLiveSocket";

const MEASUREMENT_DURATION_MS = 6000;
const MEASUREMENT_DURATION_S = 6;
const LIVE_BATCH_MS = 50;

const packSeries = (arr) => {
  if (!Array.isArray(arr) || !arr.length) return [];
  const out = new Array(arr.length);
  for (let i = 0; i < arr.length; i += 1) {
    const n = Number(arr[i]);
    out[i] = Number.isFinite(n) ? Math.round(n * 1000) / 1000 : 0;
  }
  return out;
};

function calculateMode(arr) {
  const frequencyMap = {};

  arr.forEach((num) => {
    const rounded = parseFloat(num.toFixed(2));
    frequencyMap[rounded] = (frequencyMap[rounded] || 0) + 1;
  });

  let mode = arr[0];
  let maxFrequency = 0;

  for (const num in frequencyMap) {
    if (frequencyMap[num] > maxFrequency) {
      maxFrequency = frequencyMap[num];
      mode = parseFloat(num);
    }
  }

  return mode;
}

const ExerciseScreen = ({ route, navigation }) => {
  const exercise = route.params?.exercise || {
    color: "#a3e635",
    icon: "body-outline",
    name: "CMJ",
    type: "PP",
  };
  const { currentClient } = useAuth();
  const planConfig = usePlanModuleConfig("jump");
  const suggestedLegSide =
    route.params?.defaultLegSide || planConfig?.defaultLegSide || "";
  const liveWsUrl = route.params?.liveWsUrl || "";
  const liveRoom = route.params?.liveRoom || "";
  const liveEnabled = Boolean(liveWsUrl && liveRoom);
  const accentColor = exercise.color || "#a3e635";

  const [isMeasuring, setIsMeasuring] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(MEASUREMENT_DURATION_S);
  const { cue, emit, runStartSequence } = useEvaluationCommands({ accentColor });
  const [bodyWeight, setBodyWeight] = useState(null);
  const [legSide, setLegSide] = useState(null);
  const [showLegModal, setShowLegModal] = useState(false);

  const startTimeRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const accelerometerSubRef = useRef(null);
  const dataRef = useRef([]);
  const isMeasuringRef = useRef(false);
  const liveBatchRef = useRef([]);
  const liveBatchTimerRef = useRef(null);
  const startMeasurementRef = useRef(null);
  const stopMeasurementRef = useRef(null);
  const liveSendRef = useRef(null);
  const bodyWeightRef = useRef(null);
  const legSideRef = useRef(null);

  const applyLiveConfig = useCallback((msg = {}) => {
    const hasWeight = Object.prototype.hasOwnProperty.call(
      msg,
      "bodyWeightKg",
    );
    const hasLeg = Object.prototype.hasOwnProperty.call(msg, "legSide");
    if (hasWeight) {
      const kg = Number(msg.bodyWeightKg);
      if (Number.isFinite(kg) && kg >= 30 && kg <= 200) {
        bodyWeightRef.current = kg;
        setBodyWeight(kg);
      }
    }
    if (hasLeg && ["right", "left", "both"].includes(msg.legSide)) {
      legSideRef.current = msg.legSide;
      setLegSide(msg.legSide);
      setShowLegModal(false);
    }
  }, []);

  const flushLiveBatch = useCallback(() => {
    if (!liveSendRef.current || !liveBatchRef.current.length) return;
    const samples = liveBatchRef.current;
    liveBatchRef.current = [];
    liveSendRef.current({ type: "sample_batch", samples });
  }, []);

  const handleLiveCommand = useCallback(
    (action, msg = {}) => {
      if (action === "config") {
        applyLiveConfig(msg);
        return;
      }
      if (action === "start") {
        applyLiveConfig(msg);
        startMeasurementRef.current?.();
        return;
      }
      if (action === "stop") {
        stopMeasurementRef.current?.();
      }
    },
    [applyLiveConfig],
  );

  const {
    status: liveStatus,
    error: liveError,
    roomState: liveRoomState,
    send: liveSend,
    connect: liveConnect,
    isOpen: liveOpen,
  } = useCmjLiveSocket({
    url: liveWsUrl,
    room: liveRoom,
    enabled: liveEnabled,
    onCommand: handleLiveCommand,
  });

  liveSendRef.current = liveSend;
  // No pisar refs con null si el live acaba de setear peso/lado desde la PC.
  if (bodyWeight != null) bodyWeightRef.current = bodyWeight;
  if (legSide != null) legSideRef.current = legSide;

  const clearMeasurementTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const stopAccelerometer = () => {
    if (accelerometerSubRef.current) {
      accelerometerSubRef.current.remove();
      accelerometerSubRef.current = null;
    }
  };

  const startMeasurement = async () => {
    const weight = bodyWeightRef.current;
    const side = legSideRef.current;
    if (!weight || !side) return;
    if (isMeasuring || isProcessing || isStarting) return;

    dataRef.current = [];
    liveBatchRef.current = [];
    setTimeLeft(MEASUREMENT_DURATION_S);
    setIsProcessing(false);
    setIsMeasuring(false);
    isMeasuringRef.current = false;
    setIsStarting(true);
    liveSend({ type: "status", phase: "countdown" });

    await runStartSequence({ accentColor });

    setIsStarting(false);
    startTimeRef.current = Date.now();
    isMeasuringRef.current = true;
    setIsMeasuring(true);
    liveSend({ type: "status", phase: "measuring", timeLeft: MEASUREMENT_DURATION_S });
  };

  const stopMeasurement = async () => {
    if (!isMeasuringRef.current) return;

    isMeasuringRef.current = false;
    setIsMeasuring(false);
    clearMeasurementTimer();
    stopAccelerometer();
    if (liveBatchTimerRef.current) {
      clearInterval(liveBatchTimerRef.current);
      liveBatchTimerRef.current = null;
    }
    flushLiveBatch();

    await emit("FINISHED", { accentColor });
    setIsProcessing(true);
    liveSend({ type: "status", phase: "processing" });

    try {
      let currentData = [...dataRef.current];

      if (!currentData || currentData.length === 0) {
        Alert.alert(
          "Sin datos",
          "No se recolectaron datos del sensor. Asegúrate de que el dispositivo esté estable.",
        );
        liveSend({ type: "status", phase: "idle" });
        return;
      }
      if (currentData.length > 50) {
        currentData = currentData.slice(50);
      } else {
        Alert.alert(
          "Datos insuficientes",
          "No se recolectaron suficientes datos para un análisis válido.",
        );
        liveSend({ type: "status", phase: "idle" });
        return;
      }

      const { accX, accY, accZ, accT } = accelerationArrays(currentData);
      const accResultante = accY.map((y, i) =>
        Math.sqrt(accX[i] * accX[i] + y * y + accZ[i] * accZ[i]),
      );

      const passes = [2, 2, 1, 2, 1, 2, 1];
      const upRemoved = removeUpwardPeaksMulti(accResultante, passes);
      const response = highPassFilter(upRemoved);

      const modo = calculateMode(accResultante);
      const accResultanteSeteado = accResultante.map((el) => el - modo);
      const testTimeInput = accT[accT.length - 1];
      const peakAz = Math.max(...accResultante.map((v) => Math.abs(v)));
      const weightForProcess = Number(
        bodyWeightRef.current ?? bodyWeight ?? 0,
      );
      const sideForResult = legSideRef.current || legSide || "";

      if (!Number.isFinite(weightForProcess) || weightForProcess < 30) {
        Alert.alert(
          "Peso inválido",
          "Configurá un peso entre 30 y 200 kg antes de medir.",
        );
        liveSend({ type: "status", phase: "idle" });
        return;
      }

      let charts = null;
      let metrics = null;
      try {
        const { cMJDataObject = {} } =
          jumpProcess(response, testTimeInput, weightForProcess, accT) || {};
        charts = {
          fullJump: {
            t: packSeries(accT),
            a: packSeries(response),
          },
          eccentricConcentric: {
            t: packSeries(cMJDataObject.arrayY13T),
            a: packSeries(cMJDataObject.arrayY13),
            v: packSeries(cMJDataObject.velocidadPonderada),
            d: packSeries(cMJDataObject.displacement),
          },
          propulsive: {
            t: packSeries(cMJDataObject.propulsiveAccTime),
            a: packSeries(cMJDataObject.propulsiveAcceleration),
          },
        };
        metrics = {
          validated: Boolean(cMJDataObject.validated),
          flightHeight: cMJDataObject.alturaVuelo,
          flightTime: cMJDataObject.tV,
          takeoffSpeed: cMJDataObject.velD,
          tiempoPropulsivo: cMJDataObject.tiempoPropulsivo,
          distanciaPropulsiva: cMJDataObject.distanciaPropulsiva,
          meanPropulsiveForce: cMJDataObject.meanPropulsiveForce,
          meanPropulsivePower: cMJDataObject.meanPropulsivePower,
          rSI: cMJDataObject.rSI,
        };
      } catch (chartErr) {
        console.warn("CMJ live charts:", chartErr);
      }

      liveSend({
        type: "result",
        sampleCount: currentData.length,
        peakAz,
        durationMs: testTimeInput,
        jumpHint: `CMJ listo · ${currentData.length} muestras · pico ${peakAz.toFixed(2)} g`,
        bodyWeightKg: weightForProcess,
        legSide: sideForResult,
        charts,
        metrics,
      });
      liveSend({ type: "status", phase: "done" });

      navigation.navigate("JumpResults", {
        accY: response,
        accT,
        testTimeInput,
        exercise,
        bodyWeight: weightForProcess,
        legSide: sideForResult,
        accResultante: accResultanteSeteado,
        currentData,
      });
    } catch (error) {
      console.error("Error procesando datos:", error);
      Alert.alert("Error", "Ocurrió un error al procesar los datos");
      liveSend({ type: "status", phase: "idle" });
    } finally {
      setIsProcessing(false);
    }
  };

  startMeasurementRef.current = startMeasurement;
  stopMeasurementRef.current = stopMeasurement;

  const handleWeightSelected = (weight) => {
    setBodyWeight(weight);
    if (["right", "left", "both"].includes(suggestedLegSide)) {
      setLegSide(suggestedLegSide);
      return;
    }
    setShowLegModal(true);
  };

  const selectLegSide = (side) => {
    setLegSide(side);
    setShowLegModal(false);
  };

  useEffect(() => {
    (async () => {
      const { status } = await Accelerometer.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permiso requerido",
          "Se necesita acceso al acelerómetro para medir el salto.",
        );
        navigation.goBack();
      }
    })();
  }, [navigation]);

  useEffect(() => {
    const handleAccelerometerData = (accelData) => {
      const ts = Date.now();
      dataRef.current.push({
        ...accelData,
        timestamp: ts,
      });
      if (liveEnabled) {
        const az = Number(accelData?.z);
        if (Number.isFinite(az)) {
          liveBatchRef.current.push([ts, az]);
        }
      }
    };

    if (isMeasuring) {
      Accelerometer.setUpdateInterval(10);
      accelerometerSubRef.current = Accelerometer.addListener(
        handleAccelerometerData,
      );
      if (liveEnabled) {
        liveBatchTimerRef.current = setInterval(flushLiveBatch, LIVE_BATCH_MS);
      }
    }

    return () => {
      stopAccelerometer();
      if (liveBatchTimerRef.current) {
        clearInterval(liveBatchTimerRef.current);
        liveBatchTimerRef.current = null;
      }
    };
  }, [flushLiveBatch, isMeasuring, liveEnabled]);

  useEffect(() => {
    if (!isMeasuring) {
      clearMeasurementTimer();
      return;
    }

    startTimeRef.current = Date.now();

    timerIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, MEASUREMENT_DURATION_MS - elapsed);
      const secs = Math.ceil(remaining / 1000);
      setTimeLeft(secs);
      if (liveEnabled) {
        liveSend({ type: "status", phase: "measuring", timeLeft: secs });
      }

      if (remaining <= 0) {
        clearMeasurementTimer();
        stopMeasurementRef.current?.();
      }
    }, 250);

    return () => {
      clearMeasurementTimer();
    };
  }, [isMeasuring, liveEnabled, liveSend]);

  useEffect(() => {
    return () => {
      clearMeasurementTimer();
      stopAccelerometer();
      if (liveBatchTimerRef.current) {
        clearInterval(liveBatchTimerRef.current);
        liveBatchTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!liveOpen || !bodyWeight || !legSide) return;
    liveSend({
      type: "sensor_info",
      deviceName: "Expo",
      bodyWeightKg: bodyWeight,
      legSide,
      room: liveRoom,
    });
  }, [bodyWeight, legSide, liveOpen, liveRoom, liveSend]);

  const readyToMeasure = Boolean(bodyWeight && legSide);

  return (
    <LinearGradient colors={["#0f0f0f", "#1a1a1a"]} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerButton}>
          <TouchableOpacity
            onPress={() => navigation.navigate("Home")}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={20} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>HOME</Text>
        </View>

        <Image
          source={require("../../../assets/e_icono.png")}
          style={styles.appIcon}
          resizeMode="contain"
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <ExerciseInstructions exercise={exercise.type} compactMode={true} />
        <Clinometer />

        {liveEnabled ? (
          <View style={styles.liveBanner}>
            <Text style={styles.liveBannerTitle}>PC live · sala {liveRoom}</Text>
            <Text style={styles.liveBannerText}>
              WS {liveStatus}
              {liveOpen
                ? ` · viewers ${liveRoomState.viewers}`
                : liveError
                  ? ` · ${liveError}`
                  : ""}
            </Text>
            <Text style={styles.liveBannerHint}>{liveWsUrl}</Text>
            <Text style={styles.liveBannerHint}>
              Misma Wi‑Fi que la PC. En el browser del celu probá{" "}
              http://{String(liveWsUrl).replace(/^ws:\/\//, "").replace(/\/$/, "")}/
              — si no carga, es red/firewall.
            </Text>
            {!liveOpen ? (
              <TouchableOpacity style={styles.liveReconnect} onPress={liveConnect}>
                <Text style={styles.liveReconnectText}>Reconectar</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.liveBannerHint}>
                Podés iniciar desde el celular o desde la PC (Iniciar CMJ).
              </Text>
            )}
          </View>
        ) : null}

        {bodyWeight && legSide ? (
          <View style={styles.selectionInfo}>
            <Text style={styles.selectionText}>
              {currentClient?.name} {currentClient?.surname} - {bodyWeight} kg -
              Lado:{" "}
              {legSide === "right"
                ? "Derecho"
                : legSide === "left"
                  ? "Izquierdo"
                  : "Ambos"}
            </Text>
          </View>
        ) : null}

        {!readyToMeasure ? (
          <WeightSelector onWeightSelected={handleWeightSelected} />
        ) : (
          <EvaluationMeasurementBlock
            accentColor={accentColor}
            cue={cue}
            timeLeft={timeLeft}
            isMeasuring={isMeasuring}
            isProcessing={isProcessing}
            isStarting={isStarting}
            onStart={startMeasurement}
            onStop={stopMeasurement}
            secondaryAction={{
              label: "VOLVER A SELECCIONAR",
              onPress: () => navigation.navigate("JumpExerciseSelection"),
            }}
          />
        )}
      </ScrollView>

      <Modal
        visible={showLegModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLegModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Selecciona la pierna</Text>

            <TouchableOpacity
              style={styles.legButton}
              onPress={() => selectLegSide("right")}
            >
              <Text style={styles.legButtonText}>Pierna Derecha</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.legButton}
              onPress={() => selectLegSide("left")}
            >
              <Text style={styles.legButtonText}>Pierna Izquierda</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.legButton}
              onPress={() => selectLegSide("both")}
            >
              <Text style={styles.legButtonText}>Ambas Piernas</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  liveBanner: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(8, 145, 178, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.45)",
  },
  liveBannerTitle: {
    color: "#67e8f9",
    fontWeight: "800",
    marginBottom: 4,
  },
  liveBannerText: {
    color: "#e2e8f0",
    fontSize: 13,
  },
  liveBannerHint: {
    marginTop: 6,
    color: "#94a3b8",
    fontSize: 12,
  },
  liveReconnect: {
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: "#0891b2",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  liveReconnectText: {
    color: "#ecfeff",
    fontWeight: "800",
    fontSize: 13,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  headerButton: {
    flexDirection: "row",
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  appIcon: {
    width: 44,
    height: 44,
    tintColor: "#00ffff",
    marginRight: 8,
  },
  backButton: { marginRight: 12 },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  selectionInfo: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 10,
    borderRadius: 8,
    marginVertical: 10,
    alignItems: "center",
  },
  selectionText: {
    color: "#00ffff",
    fontWeight: "500",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#1a1a1a",
    width: "80%",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  modalTitle: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 20,
    textAlign: "center",
  },
  legButton: {
    backgroundColor: "rgba(0, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(0, 255, 255, 0.3)",
    borderRadius: 8,
    padding: 15,
    marginVertical: 5,
    alignItems: "center",
  },
  legButtonText: {
    color: "#00ffff",
    fontWeight: "500",
    fontSize: 16,
  },
});

export default ExerciseScreen;
