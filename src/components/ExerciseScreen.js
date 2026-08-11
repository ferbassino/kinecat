import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Accelerometer } from "expo-sensors";
import {
  activateKeepAwakeAsync,
  deactivateKeepAwake,
} from "expo-keep-awake";
import { analyzeStability } from "../auxiliaries/analyzeStability";
import Clinometer from "./clinometer/Clinometer";
import { Ionicons } from "@expo/vector-icons";
import ExerciseInstructions from "./ExerciseInstructions";
import EvaluationMeasurementBlock from "./EvaluationMeasurementBlock";
import { useEvaluationCommands } from "../hooks/useEvaluationCommands";
import { calculateAngles } from "../auxiliaries/angles/calculateAngles";

const { width } = Dimensions.get("window");

const KEEP_AWAKE_TAG = "stability-measurement";
const MEASUREMENT_DURATION_MS = 30000;

const ExerciseScreen = ({ route, navigation }) => {
  const { exercise } = route.params;

  const [isMeasuring, setIsMeasuring] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [selectedBodySide, setSelectedBodySide] = useState(null);
  const accentColor = exercise?.color || "#00ffff";
  const { cue, emit, runStartSequence } = useEvaluationCommands({ accentColor });

  const [sideSelectorAnim] = useState(new Animated.Value(20));
  const [sideSelectorFade] = useState(new Animated.Value(0));
  const [timerAnim] = useState(new Animated.Value(20));
  const [timerFade] = useState(new Animated.Value(0));
  const [buttonsAnim] = useState(new Animated.Value(20));
  const [buttonsFade] = useState(new Animated.Value(0));

  const startTimeRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const accelerometerSubRef = useRef(null);
  const dataRef = useRef([]);
  const keepAwakeActiveRef = useRef(false);
  const isMeasuringRef = useRef(false);

  const enableKeepAwake = async () => {
    if (keepAwakeActiveRef.current) return;

    try {
      await activateKeepAwakeAsync(KEEP_AWAKE_TAG);
      keepAwakeActiveRef.current = true;
    } catch (error) {
      console.warn("No se pudo mantener la pantalla activa:", error);
    }
  };

  const disableKeepAwake = () => {
    if (!keepAwakeActiveRef.current) return;

    try {
      deactivateKeepAwake(KEEP_AWAKE_TAG);
    } catch (error) {
      console.warn("No se pudo desactivar keep-awake:", error);
    } finally {
      keepAwakeActiveRef.current = false;
    }
  };

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

  useEffect(() => {
    // Animaciones de entrada
    const animations = [];

    if (requiresSideSelection) {
      animations.push(
        Animated.timing(sideSelectorAnim, {
          toValue: 0,
          duration: 600,
          delay: 200,
          useNativeDriver: true,
        }),
        Animated.timing(sideSelectorFade, {
          toValue: 1,
          duration: 600,
          delay: 200,
          useNativeDriver: true,
        })
      );
    }

    animations.push(
      Animated.timing(timerAnim, {
        toValue: 0,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.timing(timerFade, {
        toValue: 1,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.timing(buttonsAnim, {
        toValue: 0,
        duration: 600,
        delay: 400,
        useNativeDriver: true,
      }),
      Animated.timing(buttonsFade, {
        toValue: 1,
        duration: 600,
        delay: 400,
        useNativeDriver: true,
      })
    );

    Animated.parallel(animations).start();
  }, []);

  const requiresSideSelection = ["Apoyo Monopodal", "Puente Lateral"].includes(
    exercise.name
  );

  const startMeasurement = async () => {
    if (requiresSideSelection && !selectedBodySide) {
      Alert.alert(
        "Selección requerida",
        "Por favor selecciona un lado antes de comenzar la prueba"
      );
      return;
    }

    dataRef.current = [];
    setTimeLeft(30);
    setIsProcessing(false);
    setIsMeasuring(false);
    isMeasuringRef.current = false;
    setIsStarting(true);
    await enableKeepAwake();
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
    disableKeepAwake();

    await emit("FINISHED", { accentColor });
    setIsProcessing(true);

    try {
      let currentData = [...dataRef.current];

      if (!currentData || currentData.length === 0) {
        Alert.alert(
          "Sin datos",
          "No se recolectaron datos del sensor. Mantené la pantalla encendida durante la prueba."
        );
        return;
      }
      if (currentData.length < 300) {
        Alert.alert(
          "Datos insuficientes",
          "La prueba se interrumpió o fue muy corta. Mantené la pantalla desbloqueada los 30 segundos."
        );
        return;
      }

      const { pitch, roll } = calculateAngles(currentData);
      const analysis = analyzeStability(currentData);

      navigation.navigate("Results", {
        cv: analysis.cv,
        ventanas: analysis.ventanas,
        permutationEn: analysis.permutationEn,
        regularity: analysis.regularity,
        rms: analysis.rms,
        rmsMg: analysis.rmsMg,
        isBaseline: analysis.isBaseline,
        interpretation: analysis.interpretation,
        cvTrend: analysis.cvTrend,
        permEnTrend: analysis.permEnTrend,
        analysisVersion: analysis.analysisVersion,
        exercise,
        currentData,
        pitch,
        roll,
        bodySide: selectedBodySide || "none",
      });
    } catch (error) {
      console.error("Error procesando datos:", error);
      Alert.alert("Error", "Ocurrió un error al procesar los datos");
    } finally {
      setIsProcessing(false);
    }
  };

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
      disableKeepAwake();
    };
  }, []);

  return (
    <LinearGradient colors={["#0f0f0f", "#1a1a1a"]} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerButton}>
          <TouchableOpacity
            onPress={() => navigation.navigate("ExerciseSelection")}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={20} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>SELECCIONAR</Text>
        </View>

        <Image
          source={require("../assets/e_icono.png")}
          style={styles.appIcon}
          resizeMode="contain"
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <ExerciseInstructions exercise={exercise.type} compactMode={true} />
        <Clinometer />

        {requiresSideSelection && (
          <Animated.View
            style={[
              styles.sideSelectorContainer,
              {
                opacity: sideSelectorFade,
                transform: [{ translateY: sideSelectorAnim }],
              },
            ]}
          >
            <Text style={styles.sideSelectorTitle}>SELECCIONA EL LADO</Text>
            <View style={styles.sideButtonsContainer}>
              <TouchableOpacity
                style={[
                  styles.sideButton,
                  selectedBodySide === "left" && styles.sideButtonSelected,
                ]}
                onPress={() => setSelectedBodySide("left")}
              >
                <Text
                  style={[
                    styles.sideButtonText,
                    selectedBodySide === "left" &&
                      styles.sideButtonTextSelected,
                  ]}
                >
                  IZQUIERDO
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sideButton,
                  selectedBodySide === "right" && styles.sideButtonSelected,
                ]}
                onPress={() => setSelectedBodySide("right")}
              >
                <Text
                  style={[
                    styles.sideButtonText,
                    selectedBodySide === "right" &&
                      styles.sideButtonTextSelected,
                  ]}
                >
                  DERECHO
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        <Animated.View
          style={{
            opacity: timerFade,
            transform: [{ translateY: timerAnim }],
          }}
        >
          <EvaluationMeasurementBlock
            accentColor={accentColor}
            cue={cue}
            timeLeft={timeLeft}
            isMeasuring={isMeasuring}
            isProcessing={isProcessing}
            isStarting={isStarting}
            onStart={startMeasurement}
            onStop={stopMeasurement}
            keepAwakeHint
            secondaryAction={{
              label: "VOLVER A SELECCIONAR",
              onPress: () => navigation.navigate("ExerciseSelection"),
            }}
          />
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  // header
  header: {
    marginTop: 60,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
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
    width: 32,
    height: 32,
    tintColor: "#00ffff",
    marginRight: 8,
  },
  // header
  backButton: { marginRight: 12 },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  sideSelectorContainer: {
    marginBottom: 20,
    alignItems: "center",
    width: "100%",
  },
  sideSelectorTitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 1,
    marginBottom: 12,
    textAlign: "center",
  },
  sideButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  sideButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  sideButtonSelected: {
    backgroundColor: "rgba(0, 180, 216, 0.2)",
    borderBottomWidth: 2,
    borderBottomColor: "#00b4d8",
  },
  sideButtonText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  sideButtonTextSelected: {
    color: "#00b4d8",
    fontWeight: "bold",
  },
});

export default ExerciseScreen;
