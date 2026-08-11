import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, { SlideInLeft } from "react-native-reanimated";

const DEFAULT_EXERCISE = {
  type: "default",
  name: "Ejercicio",
};

const DEFAULT_EXERCISE_DATA = {
  default: {
    gradient: ["#666", "#888"],
    icon: "help",
  },
};

const ExerciseHeader = ({
  exercise = DEFAULT_EXERCISE,
  exerciseData = DEFAULT_EXERCISE_DATA,
}) => {
  const currentExercise =
    exerciseData[exercise?.type] || DEFAULT_EXERCISE_DATA.default;
  const exerciseName = exercise?.name || DEFAULT_EXERCISE.name;

  return (
    <Animated.View
      entering={SlideInLeft.duration(600)}
      style={styles.exerciseHeader}
    >
      <LinearGradient
        colors={currentExercise.gradient}
        style={styles.exerciseGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Ionicons
          name={currentExercise.icon}
          size={28}
          color="white"
          style={styles.icon}
        />
        <Text style={styles.exerciseTitle}>{exerciseName.toUpperCase()}</Text>
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
  icon: {
    minWidth: 28, // Evita cambios de layout si el icono no carga
  },
});

export default ExerciseHeader;
