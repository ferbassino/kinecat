import React, { useState, useEffect, useRef } from "react";
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
import { useAuth } from "../../../auth/AuthContext";
import usePlanModuleConfig from "../../../hooks/usePlanModuleConfig";

const MEASUREMENT_DURATION_MS = 6000;
const MEASUREMENT_DURATION_S = 6;

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
    if (!bodyWeight || !legSide) return;
    if (isMeasuring || isProcessing || isStarting) return;

    dataRef.current = [];
    setTimeLeft(MEASUREMENT_DURATION_S);
    setIsProcessing(false);
    setIsMeasuring(false);
    isMeasuringRef.current = false;
    setIsStarting(true);

    await runStartSequence({ accentColor });

    setIsStarting(false);
    startTimeRef.current = Date.now();
    isMeasuringRef.current = true;
    setIsMeasuring(true);
  };

  const stopMeasurement = async () => {
    if (!isMeasuringRef.current) return;

    isMeasuringRef.current = false;
    setIsMeasuring(false);
    clearMeasurementTimer();
    stopAccelerometer();

    await emit("FINISHED", { accentColor });
    setIsProcessing(true);

    try {
      let currentData = [...dataRef.current];

      if (!currentData || currentData.length === 0) {
        Alert.alert(
          "Sin datos",
          "No se recolectaron datos del sensor. Asegúrate de que el dispositivo esté estable.",
        );
        return;
      }
      if (currentData.length > 50) {
        currentData = currentData.slice(50);
      } else {
        Alert.alert(
          "Datos insuficientes",
          "No se recolectaron suficientes datos para un análisis válido.",
        );
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

      navigation.navigate("JumpResults", {
        accY: response,
        accT,
        testTimeInput,
        exercise,
        bodyWeight,
        legSide,
        accResultante: accResultanteSeteado,
        currentData,
      });
    } catch (error) {
      console.error("Error procesando datos:", error);
      Alert.alert("Error", "Ocurrió un error al procesar los datos");
    } finally {
      setIsProcessing(false);
    }
  };

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
      dataRef.current.push({
        ...accelData,
        timestamp: Date.now(),
      });
    };

    if (isMeasuring) {
      Accelerometer.setUpdateInterval(10);
      accelerometerSubRef.current = Accelerometer.addListener(
        handleAccelerometerData,
      );
    }

    return () => {
      stopAccelerometer();
    };
  }, [isMeasuring]);

  useEffect(() => {
    if (!isMeasuring) {
      clearMeasurementTimer();
      return;
    }

    startTimeRef.current = Date.now();

    timerIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, MEASUREMENT_DURATION_MS - elapsed);
      setTimeLeft(Math.ceil(remaining / 1000));

      if (remaining <= 0) {
        clearMeasurementTimer();
        stopMeasurement();
      }
    }, 250);

    return () => {
      clearMeasurementTimer();
    };
  }, [isMeasuring]);

  useEffect(() => {
    return () => {
      clearMeasurementTimer();
      stopAccelerometer();
    };
  }, []);

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
