import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

/**
 * Guía visual: teléfono en paisaje con flecha en el borde a apoyar
 * y lados IZQ/DER del paciente alineados al signo del ATR.
 */
const PhoneRestGuide = () => {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Apoyá este borde en la espalda</Text>

      <View style={styles.row}>
        <View style={styles.sideCol}>
          <Text style={styles.sideLabel}>IZQ</Text>
          <Text style={styles.sideSub}>paciente</Text>
          <Text style={styles.sideSign}>ATR −</Text>
        </View>

        <View style={styles.phoneCol}>
          <Text style={styles.headHint}>← cabeza</Text>

          <View style={styles.phone}>
            <View style={styles.phoneTopBar} />
            <Text style={styles.phoneScreenHint}>pantalla</Text>
            <View style={styles.usbTag}>
              <Text style={styles.usbTagText}>USB → pies</Text>
            </View>
          </View>

          <View style={styles.arrowBlock}>
            <Ionicons name="arrow-down" size={36} color="#a78bfa" />
            <View style={styles.restEdge}>
              <Text style={styles.restEdgeText}>APOYAR AQUÍ</Text>
            </View>
          </View>
        </View>

        <View style={styles.sideCol}>
          <Text style={styles.sideLabel}>DER</Text>
          <Text style={styles.sideSub}>paciente</Text>
          <Text style={styles.sideSign}>ATR +</Text>
        </View>
      </View>

      <Text style={styles.caption}>
        Móvil de costado · borde largo inferior sobre la espalda · mirando la
        pantalla: izquierda = IZQ del paciente (−), derecha = DER (+)
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: "rgba(124, 58, 237, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(167, 139, 250, 0.4)",
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  title: {
    color: "#ddd6fe",
    fontWeight: "800",
    fontSize: 13,
    textAlign: "center",
    letterSpacing: 0.3,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  sideCol: {
    width: 64,
    alignItems: "center",
    gap: 2,
  },
  sideLabel: {
    color: "#f8fafc",
    fontWeight: "900",
    fontSize: 16,
  },
  sideSub: {
    color: "#94a3b8",
    fontSize: 10,
    fontWeight: "600",
  },
  sideSign: {
    color: "#a78bfa",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 2,
  },
  phoneCol: {
    alignItems: "center",
    flex: 1,
    maxWidth: 180,
  },
  headHint: {
    color: "#64748b",
    fontSize: 11,
    marginBottom: 4,
  },
  phone: {
    width: "100%",
    height: 88,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#c4b5fd",
    backgroundColor: "#1e1b4b",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  phoneTopBar: {
    position: "absolute",
    top: 8,
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  phoneScreenHint: {
    color: "rgba(226,232,240,0.55)",
    fontSize: 12,
    fontWeight: "600",
  },
  usbTag: {
    position: "absolute",
    right: 6,
    bottom: 8,
    backgroundColor: "rgba(15,23,42,0.75)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  usbTagText: {
    color: "#fde68a",
    fontSize: 9,
    fontWeight: "800",
  },
  arrowBlock: {
    alignItems: "center",
    marginTop: 2,
    gap: 2,
  },
  restEdge: {
    width: "100%",
    backgroundColor: "#7c3aed",
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: "center",
  },
  restEdgeText: {
    color: "#f5f3ff",
    fontWeight: "900",
    fontSize: 12,
    letterSpacing: 0.6,
  },
  caption: {
    color: "#94a3b8",
    fontSize: 11,
    lineHeight: 15,
    textAlign: "center",
    marginTop: 4,
  },
});

export default PhoneRestGuide;
