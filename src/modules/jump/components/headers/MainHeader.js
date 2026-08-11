import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import BackButton from "../buttons/BackButton";

const MainHeader = ({ title }) => {
  return (
    <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
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
