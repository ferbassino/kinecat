import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import EvaluationCommandFeedback from "./EvaluationCommandFeedback";

const EvaluationMeasurementBlock = ({
  accentColor = "#00ffff",
  cue,
  timeLeft,
  isMeasuring,
  isProcessing,
  isStarting = false,
  onStart,
  onStop,
  secondaryAction,
  keepAwakeHint = false,
  startLabel = "COMENZAR",
}) => {
  const busy = isMeasuring || isProcessing || isStarting;

  return (
    <>
      <View style={styles.timerContainer}>
        <Text style={styles.timerText}>{timeLeft}</Text>
        <Text style={styles.timerLabel}>TIEMPO RESTANTE (s)</Text>
        {keepAwakeHint && busy ? (
          <Text style={[styles.keepAwakeHint, { color: accentColor }]}>
            Pantalla activa · no bloquees el teléfono
          </Text>
        ) : null}
      </View>

      <EvaluationCommandFeedback cue={cue} accentColor={accentColor} />

      <View style={styles.buttonsContainer}>
        {!busy ? (
          <>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={onStart}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#00ffff", "#00b4d8"]}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.buttonText}>{startLabel}</Text>
                <Ionicons name="play" size={18} color="white" />
              </LinearGradient>
            </TouchableOpacity>

            {secondaryAction ? (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={secondaryAction.onPress}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["#a855f7", "#7e22ce"]}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.buttonText}>{secondaryAction.label}</Text>
                  <Ionicons
                    name={secondaryAction.icon || "ellipsis-vertical-circle-outline"}
                    size={18}
                    color="white"
                  />
                </LinearGradient>
              </TouchableOpacity>
            ) : null}
          </>
        ) : null}

        {isMeasuring ? (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onStop}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>DETENER</Text>
            <Ionicons name="stop" size={18} color="#ec4899" />
          </TouchableOpacity>
        ) : null}

        {isProcessing ? (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="small" color={accentColor} />
            <Text style={styles.processingText}>Procesando resultados...</Text>
          </View>
        ) : null}

        {isStarting ? (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="small" color={accentColor} />
            <Text style={styles.processingText}>Preparando...</Text>
          </View>
        ) : null}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  timerContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  timerText: {
    color: "#ffffff",
    fontSize: 50,
    fontWeight: "bold",
  },
  timerLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 1,
    marginTop: 5,
  },
  keepAwakeHint: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 8,
    textAlign: "center",
    opacity: 0.85,
  },
  buttonsContainer: {
    width: "100%",
    marginBottom: 20,
  },
  primaryButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
  },
  buttonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "rgba(236, 72, 153, 0.3)",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(236, 72, 153, 0.1)",
  },
  secondaryButtonText: {
    color: "#ec4899",
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  processingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 10,
  },
  processingText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
  },
});

export default EvaluationMeasurementBlock;
