import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Gyroscope } from "expo-sensors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import ScreenLayout from "../../../components/ScreenLayout";
import EvaluationMeasurementBlock from "../../../components/EvaluationMeasurementBlock";
import { useEvaluationCommands } from "../../../hooks/useEvaluationCommands";
import {
  TEST_TIME_MS,
  formatMovementLabel,
  formatSegmentLabel,
  formatSideLabel,
} from "../auxiliaries/artroHelpers";

const ACCENT = "#a855f7";
const MEASUREMENT_DURATION_MS = TEST_TIME_MS;
const MEASUREMENT_DURATION_S = Math.ceil(MEASUREMENT_DURATION_MS / 1000);

const EvaluationScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { segment, side, movement, corporalPart } = route.params;

  const [isMeasuring, setIsMeasuring] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(MEASUREMENT_DURATION_S);

  const gyroBufferRef = useRef([]);
  const startTimeRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const gyroSubRef = useRef(null);
  const isMeasuringRef = useRef(false);

  const { cue, emit, runStartSequence } = useEvaluationCommands({
    accentColor: ACCENT,
  });

  const clearMeasurementTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const stopGyro = () => {
    if (gyroSubRef.current) {
      gyroSubRef.current.remove();
      gyroSubRef.current = null;
    }
  };

  useEffect(() => {
    (async () => {
      const { status } = await Gyroscope.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permiso requerido",
          "Se necesita acceso al giroscopio para medir.",
        );
        navigation.goBack();
      }
    })();

    return () => {
      clearMeasurementTimer();
      stopGyro();
    };
  }, [navigation]);

  const finishWithData = async () => {
    stopGyro();
    await emit("FINISHED", { accentColor: ACCENT });
    setIsProcessing(true);

    const data = [...gyroBufferRef.current];

    if (!data.length) {
      Alert.alert("Error", "No se capturaron datos del giroscopio.");
      setIsProcessing(false);
      return;
    }

    navigation.navigate("ArtroResults", {
      segment,
      side,
      movement,
      corporalPart,
      gyroData: data,
      testTimeInput: MEASUREMENT_DURATION_MS,
    });
    setIsProcessing(false);
  };

  const stopMeasurement = async () => {
    if (!isMeasuringRef.current) return;

    isMeasuringRef.current = false;
    setIsMeasuring(false);
    clearMeasurementTimer();
    await finishWithData();
  };

  const startMeasurement = async () => {
    if (isMeasuring || isProcessing || isStarting) return;

    gyroBufferRef.current = [];
    setTimeLeft(MEASUREMENT_DURATION_S);
    setIsProcessing(false);
    setIsMeasuring(false);
    isMeasuringRef.current = false;
    setIsStarting(true);

    await runStartSequence({ accentColor: ACCENT });

    setIsStarting(false);
    startTimeRef.current = Date.now();
    isMeasuringRef.current = true;
    setIsMeasuring(true);
  };

  useEffect(() => {
    const handleGyroData = (data) => {
      gyroBufferRef.current.push(data);
    };

    if (isMeasuring) {
      Gyroscope.setUpdateInterval(10);
      gyroSubRef.current = Gyroscope.addListener(handleGyroData);
    }

    return () => {
      stopGyro();
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
        isMeasuringRef.current = false;
        setIsMeasuring(false);
        finishWithData();
      }
    }, 250);

    return () => {
      clearMeasurementTimer();
    };
  }, [isMeasuring]);

  return (
    <LinearGradient colors={["#0f0f0f", "#1a1a1a"]} style={styles.container}>
      <ScreenLayout bottomInset>
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            disabled={isMeasuring || isStarting}
          >
            <Ionicons name="chevron-back" size={20} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>MEDICIÓN</Text>
          <Image
            source={require("../../../assets/e_icono.png")}
            style={styles.appIcon}
            resizeMode="contain"
          />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>
              {formatSegmentLabel(segment)} · {formatMovementLabel(movement)}
            </Text>
            {side ? (
              <Text style={styles.infoSubtitle}>{formatSideLabel(side)}</Text>
            ) : null}
            <Text style={styles.infoMeta}>{corporalPart}</Text>
          </View>

          <Text style={styles.instructions}>
            Colocá el teléfono según la articulación. Escuchá{" "}
            <Text style={styles.instructionsHighlight}>Preparado</Text>,{" "}
            <Text style={styles.instructionsHighlight}>Listo</Text> y movete en{" "}
            <Text style={styles.instructionsHighlight}>¡Ahora!</Text> durante{" "}
            {MEASUREMENT_DURATION_S} segundos.
          </Text>

          <EvaluationMeasurementBlock
            accentColor={ACCENT}
            cue={cue}
            timeLeft={timeLeft}
            isMeasuring={isMeasuring}
            isProcessing={isProcessing}
            isStarting={isStarting}
            onStart={startMeasurement}
            onStop={stopMeasurement}
          />
        </ScrollView>
      </ScreenLayout>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  backButton: { padding: 4 },
  headerTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
    flex: 1,
    textAlign: "center",
  },
  appIcon: { width: 32, height: 32, tintColor: ACCENT },
  scrollContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 30,
  },
  infoCard: {
    width: "100%",
    backgroundColor: "rgba(44, 44, 44, 0.6)",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.3)",
    marginBottom: 24,
  },
  infoTitle: { color: "#ffffff", fontSize: 18, fontWeight: "bold" },
  infoSubtitle: { color: ACCENT, fontSize: 15, marginTop: 6 },
  infoMeta: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    marginTop: 4,
    letterSpacing: 1,
  },
  instructions: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  instructionsHighlight: {
    color: "#00ffff",
    fontWeight: "600",
  },
});

export default EvaluationScreen;
