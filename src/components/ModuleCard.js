import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const ModuleCard = ({ module, onPress, disabled, statusLabel, subtitleOverride }) => {
  const isDisabled = disabled || !module.route;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={isDisabled}
      style={[styles.wrapper, isDisabled && styles.wrapperDisabled]}
    >
      <LinearGradient
        colors={
          isDisabled
            ? ["rgba(40,40,40,0.9)", "rgba(30,30,30,0.95)"]
            : [`${module.accent}22`, "rgba(26,26,26,0.95)"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, { borderColor: `${module.accent}${isDisabled ? "33" : "55"}` }]}
      >
        <View style={[styles.iconWrap, { backgroundColor: `${module.accent}22` }]}>
          <Ionicons
            name={module.icon}
            size={28}
            color={isDisabled ? "rgba(255,255,255,0.35)" : module.accent}
          />
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, isDisabled && styles.titleDisabled]}>
              {module.title}
            </Text>
            {statusLabel ? (
              <View
                style={[
                  styles.statusPill,
                  { backgroundColor: `${module.accent}18`, borderColor: `${module.accent}44` },
                ]}
              >
                <Text style={[styles.statusPillText, { color: module.accent }]}>
                  {statusLabel}
                </Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitleOverride || module.subtitle}
          </Text>

          <View style={styles.metaRow}>
            {module.sensor ? (
              <View style={styles.metaChip}>
                <Ionicons name="hardware-chip-outline" size={12} color={module.accent} />
                <Text style={[styles.metaText, { color: module.accent }]}>
                  {module.sensor}
                </Text>
              </View>
            ) : null}
            {module.duration ? (
              <View style={styles.metaChip}>
                <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.5)" />
                <Text style={styles.metaTextMuted}>{module.duration}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <Ionicons
          name={isDisabled ? "lock-closed-outline" : "chevron-forward"}
          size={20}
          color={isDisabled ? "rgba(255,255,255,0.25)" : module.accent}
        />
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 14,
    borderRadius: 18,
    overflow: "hidden",
  },
  wrapperDisabled: {
    opacity: 0.75,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  content: {
    flex: 1,
    paddingRight: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 4,
  },
  title: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  titleDisabled: {
    color: "rgba(255,255,255,0.55)",
  },
  subtitle: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    fontWeight: "600",
  },
  metaTextMuted: {
    fontSize: 11,
    color: "rgba(255,255,255,0.45)",
  },
});

export default ModuleCard;
