import React, { useState } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import Animated, { FadeIn, FadeInUp, FadeOut } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { instructions } from "../auxiliaries/objects/instructions";

const DEFAULT_TIPS = [
  {
    icon: "time-outline",
    text: "Mantenga la posición durante 30 segundos",
  },
  {
    icon: "alert-circle-outline",
    text: "Evite arquear la espalda",
  },
];

const ExerciseInstructions = ({ exercise }) => {
  const [showInstructions, setShowInstructions] = useState(false);

  const current = instructions[exercise];
  const tips = current?.tips?.length ? current.tips : DEFAULT_TIPS;

  const toggleInstructions = () => {
    setShowInstructions((prev) => !prev);
  };

  if (!current) return null;

  return (
    <Animated.View entering={FadeIn.duration(600)} style={styles.container}>
      <LinearGradient
        colors={current.gradient}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <TouchableOpacity
          onPress={toggleInstructions}
          style={styles.infoButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel={
            showInstructions ? "Ocultar instrucciones" : "Mostrar instrucciones"
          }
        >
          <Ionicons
            name={
              showInstructions
                ? "information-circle"
                : "information-circle-outline"
            }
            size={24}
            color="white"
          />
        </TouchableOpacity>
        <Text style={styles.title}>{current.title}</Text>
      </LinearGradient>

      <Image source={current.image} style={styles.image} resizeMode="contain" />

      {showInstructions ? (
        <Animated.View
          entering={FadeInUp.duration(300)}
          exiting={FadeOut.duration(200)}
          style={[styles.instructionsContainer, { borderLeftColor: current.color }]}
        >
          <Text style={styles.description}>{current.description}</Text>

          <View style={styles.tipsContainer}>
            {tips.map((tip) => (
              <View key={tip.text} style={styles.tipItem}>
                <Ionicons
                  name={tip.icon}
                  size={18}
                  color={current.color}
                />
                <Text style={styles.tipText}>{tip.text}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      ) : null}
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
  infoButton: {
    marginRight: 8,
  },
  title: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
    letterSpacing: 0.5,
  },
  image: {
    width: "100%",
    height: 220,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  instructionsContainer: {
    backgroundColor: "rgba(30,30,30,0.7)",
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 3,
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
