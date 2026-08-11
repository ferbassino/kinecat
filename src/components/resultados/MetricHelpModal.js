import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { METRIC_HELP } from "../../auxiliaries/metricHelpContent";

const MetricHelpModal = ({ visible, metricKey, isBaseline, onClose }) => {
  const help = METRIC_HELP[metricKey];

  if (!help) return null;

  const expectItems = isBaseline
    ? [help.expectBaseline]
    : Array.isArray(help.expectExercise)
      ? help.expectExercise
      : [help.expectExercise];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <LinearGradient
            colors={["#2c2c2c", "#1a1a1a"]}
            style={styles.content}
          >
            <View style={styles.header}>
              <Text style={styles.title}>{help.title}</Text>
              <TouchableOpacity onPress={onClose} hitSlop={12}>
                <Ionicons name="close" size={24} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scroll}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.sectionLabel}>¿Qué es?</Text>
              <Text style={styles.paragraph}>{help.what}</Text>

              <Text style={styles.sectionLabel}>Unidad</Text>
              <Text style={styles.paragraph}>{help.unit}</Text>

              <Text style={styles.sectionLabel}>Qué esperar</Text>
              {expectItems.map((line) => (
                <Text key={line} style={styles.bullet}>
                  • {line}
                </Text>
              ))}

              <View style={styles.row}>
                <View style={[styles.chip, styles.chipGood]}>
                  <Text style={styles.chipTitle}>Mejor</Text>
                  <Text style={styles.chipText}>{help.good}</Text>
                </View>
                <View style={[styles.chip, styles.chipBad]}>
                  <Text style={styles.chipTitle}>Peor</Text>
                  <Text style={styles.chipText}>{help.bad}</Text>
                </View>
              </View>

              {help.note ? (
                <>
                  <Text style={styles.sectionLabel}>Nota</Text>
                  <Text style={styles.note}>{help.note}</Text>
                </>
              ) : null}
            </ScrollView>

            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>Entendido</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    padding: 20,
  },
  container: {
    maxHeight: "85%",
    borderRadius: 16,
    overflow: "hidden",
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
    paddingRight: 12,
  },
  scroll: {
    maxHeight: 420,
  },
  sectionLabel: {
    color: "#00ffff",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 12,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  paragraph: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    lineHeight: 21,
  },
  bullet: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 4,
    paddingLeft: 4,
  },
  row: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  chip: {
    flex: 1,
    borderRadius: 10,
    padding: 10,
  },
  chipGood: {
    backgroundColor: "rgba(76, 175, 80, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(76, 175, 80, 0.35)",
  },
  chipBad: {
    backgroundColor: "rgba(244, 67, 54, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(244, 67, 54, 0.3)",
  },
  chipTitle: {
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 0.5,
    marginBottom: 4,
    color: "rgba(255,255,255,0.6)",
  },
  chipText: {
    fontSize: 12,
    lineHeight: 17,
    color: "rgba(255,255,255,0.9)",
  },
  note: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    lineHeight: 18,
    fontStyle: "italic",
  },
  button: {
    marginTop: 16,
    backgroundColor: "rgba(0, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(0, 255, 255, 0.4)",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: {
    color: "#00ffff",
    fontWeight: "bold",
    fontSize: 14,
  },
});

export default MetricHelpModal;
