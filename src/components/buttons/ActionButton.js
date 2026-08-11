import React, { useState, useEffect } from "react";
import { TouchableOpacity, Text, StyleSheet, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const ActionButton = ({
  onPress,
  text,
  iconName,
  colors = ["#a855f7", "#7e22ce"],
  delay = 400,
}) => {
  const [slideAnim] = useState(new Animated.Value(30));
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Animación de entrada
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay: delay,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay: delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay]);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <TouchableOpacity style={styles.actionButton} onPress={onPress}>
        <LinearGradient
          colors={colors}
          style={styles.buttonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.buttonText}>{text}</Text>
          <Ionicons name={iconName} size={20} color="white" />
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  actionButton: {
    borderRadius: 14,
    overflow: "hidden",
  },
  buttonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
    letterSpacing: 0.5,
  },
});

export default ActionButton;
