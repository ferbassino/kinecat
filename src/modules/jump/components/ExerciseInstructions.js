import React, { useState } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import Animated, { FadeIn, FadeInUp, FadeOut } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { instructions } from "../auxiliaries/objects/instructions";
const ExerciseInstructions = ({ exercise }) => {
  const [showInstructions, setShowInstructions] = useState(false);

  const current = instructions[exercise];

  const toggleInstructions = () => {
    setShowInstructions(!showInstructions);
  };

  return (
    <Animated.View entering={FadeIn.duration(600)} style={styles.container}>
      {/* Header con título */}
      <LinearGradient
        colors={current.gradient}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Ionicons name={current.icon} size={24} color="white" />
        <Text style={styles.title}>{current.title}</Text>
      </LinearGradient>

      {/* Imagen (siempre visible) */}
      <Image source={current.image} style={styles.image} resizeMode="cover" />

      {/* Botón desplegable de instrucciones */}
      <TouchableOpacity
        onPress={toggleInstructions}
        style={styles.toggleButton}
        activeOpacity={0.7}
      >
        <View style={styles.toggleButtonContent}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={current.color}
          />
          <Text style={styles.toggleButtonText}>
            {showInstructions
              ? "Ocultar instrucciones"
              : "Mostrar instrucciones"}
          </Text>
          <Ionicons
            name={showInstructions ? "chevron-up" : "chevron-down"}
            size={20}
            color={current.color}
          />
        </View>
      </TouchableOpacity>

      {/* Instrucciones desplegables */}
      {showInstructions && (
        <Animated.View
          entering={FadeInUp.duration(300)}
          exiting={FadeOut.duration(200)}
          style={styles.instructionsContainer}
        >
          <Text style={styles.description}>{current.description}</Text>

          <View style={styles.tipsContainer}>
            <View style={styles.tipItem}>
              <Ionicons name="time-outline" size={18} color={current.color} />
              <Text style={styles.tipText}>
                Mantenga la posición durante 30 segundos
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons
                name="alert-circle-outline"
                size={18}
                color={current.color}
              />
              <Text style={styles.tipText}>Evite arquear la espalda</Text>
            </View>
          </View>
        </Animated.View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  title: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
    marginLeft: 10,
    letterSpacing: 0.5,
  },
  image: {
    width: "100%",
    height: 180,
    borderRadius: 8,
    marginBottom: 12,
  },
  toggleButton: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  toggleButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toggleButtonText: {
    color: "#fff",
    fontFamily: "Inter-SemiBold",
    fontSize: 14,
    flex: 1,
    marginHorizontal: 10,
  },
  instructionsContainer: {
    backgroundColor: "rgba(30,30,30,0.7)",
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: "rgba(255,255,255,0.2)",
  },
  description: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    fontFamily: "Inter-Regular",
    lineHeight: 22,
    marginBottom: 16,
  },
  tipsContainer: {
    marginTop: 8,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  tipText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    fontFamily: "Inter-Regular",
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
});

export default ExerciseInstructions;
