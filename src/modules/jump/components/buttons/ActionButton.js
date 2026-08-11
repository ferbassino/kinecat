import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInUp } from "react-native-reanimated";

const ActionButton = ({
  onPress,
  text,
  iconName,
  colors = ["#a855f7", "#7e22ce"],
  delay = 400,
}) => {
  return (
    <Animated.View entering={FadeInUp.delay(delay).duration(600)}>
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
