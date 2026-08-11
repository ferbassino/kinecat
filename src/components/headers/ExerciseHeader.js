import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const ExerciseHeader = ({ exercise, exerciseData }) => {
  const currentExercise = exerciseData[exercise.type];
  const [slideAnim] = useState(new Animated.Value(-100));
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Animación de entrada desde la izquierda
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.exerciseHeader,
        {
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={currentExercise.gradient}
        style={styles.exerciseGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Ionicons name={currentExercise.icon} size={28} color="white" />
        <Text style={styles.exerciseTitle}>{exercise.name.toUpperCase()}</Text>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  exerciseHeader: {
    marginTop: 18,
    marginBottom: 18,
  },
  exerciseGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
  },
  exerciseTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontFamily: "Inter-Bold",
    marginLeft: 12,
    letterSpacing: 1,
  },
});

export default ExerciseHeader;
