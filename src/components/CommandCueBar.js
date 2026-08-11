import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const CommandCueBar = ({ cue, accentColor = "#00ffff" }) => {
  if (!cue || cue.visual !== "banner") return null;

  const color = cue.accentColor || accentColor;

  return (
    <View style={[styles.container, { borderColor: `${color}55`, backgroundColor: `${color}18` }]}>
      {cue.icon ? (
        <Ionicons name={cue.icon} size={16} color={color} />
      ) : (
        <Ionicons name="megaphone-outline" size={16} color={color} />
      )}
      <Text style={[styles.text, { color }]}>{cue.text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
  },
  text: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.4,
  },
});

export default CommandCueBar;
