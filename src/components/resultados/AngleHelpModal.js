import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { ANGLE_HELP } from "../../auxiliaries/metricHelpContent";

const AngleHelpModal = ({ visible, onClose }) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onClose}
  >
    <View style={styles.overlay}>
      <View style={styles.container}>
        <LinearGradient colors={["#2c2c2c", "#1a1a1a"]} style={styles.content}>
          <View style={styles.header}>
            <Ionicons name="body-outline" size={28} color="#00ffff" />
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={24} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>{ANGLE_HELP.title}</Text>

          {ANGLE_HELP.body.map((paragraph) => (
            <Text key={paragraph} style={styles.paragraph}>
              {paragraph}
            </Text>
          ))}

          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Entendido</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    padding: 24,
  },
  container: {
    borderRadius: 16,
    overflow: "hidden",
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 14,
    lineHeight: 24,
  },
  paragraph: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 10,
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

export default AngleHelpModal;
