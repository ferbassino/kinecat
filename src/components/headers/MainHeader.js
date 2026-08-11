import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import BackButton from "../buttons/BackButton";

const MainHeader = ({ title }) => {
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Animación de fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
      <BackButton />
      <Text style={styles.headerTitle}>{title}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontFamily: "Inter-Bold",
    letterSpacing: 1,
  },
});

export default MainHeader;
