import React, { useContext, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenLayout from "../../../components/ScreenLayout";
import { AuthContext } from "../../../auth/AuthContext";
import { createMotion } from "../../../services/motion";
import { buildWeightBearingMotionPayload } from "../utils/prepareWeightBearingPayload";

const ResultsScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { user, currentClient } = useContext(AuthContext);
  const params = route.params || {};
  const [saving, setSaving] = useState(false);

  const rows = [
    { label: "Peso corporal", value: `${params.bodyWeightKg} kg` },
    { label: "Límite", value: `${params.limitPctBw}% BW` },
    { label: "Pico de carga", value: `${Number(params.peakLoadKg || 0).toFixed(1)} kg` },
    { label: "Pico % BW", value: `${Number(params.peakPctBw || 0).toFixed(1)}%` },
    {
      label: "Tiempo sobre límite",
      value: `${(Number(params.timeOverLimitMs || 0) / 1000).toFixed(1)} s`,
    },
    { label: "¿Excedió?", value: params.exceeded ? "Sí" : "No" },
    {
      label: "Duración",
      value: `${(Number(params.durationMs || 0) / 1000).toFixed(1)} s`,
    },
    { label: "Simulado", value: params.sim ? "Sí" : "No" },
  ];

  const handleSave = async () => {
    if (!user?.id) {
      Alert.alert("Login requerido", "Iniciá sesión para guardar la evaluación.");
      return;
    }
    if (!currentClient?._id && !currentClient?.id) {
      Alert.alert(
        "Paciente requerido",
        "Seleccioná un paciente antes de guardar.",
      );
      return;
    }

    try {
      setSaving(true);
      const payload = buildWeightBearingMotionPayload({
        currentClient,
        user,
        bodyWeightKg: params.bodyWeightKg,
        limitPctBw: params.limitPctBw,
        peakLoadKg: params.peakLoadKg,
        peakPctBw: params.peakPctBw,
        timeOverLimitMs: params.timeOverLimitMs,
        exceeded: params.exceeded,
        durationMs: params.durationMs,
        sampleCount: params.sampleCount,
        sim: params.sim,
        side: params.side,
      });
      await createMotion(payload);
      Alert.alert("Guardado", "Evaluación de descarga de peso guardada.", [
        { text: "OK", onPress: () => navigation.navigate("Home") },
      ]);
    } catch (error) {
      Alert.alert(
        "No se pudo guardar",
        error?.message ||
          "Volvé a tu WiFi normal (salí de Kinecat-Plate) e intentá de nuevo.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenLayout style={styles.screen} topInset>
      <View style={[styles.content, { paddingTop: Math.max(insets.top, 12) }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.navigate("WeightBearingSetup")}
        >
          <Ionicons name="arrow-back" size={22} color="#e5e7eb" />
          <Text style={styles.backText}>Nueva medición</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Resultados</Text>
        <Text style={styles.subtitle}>
          Pie {params.side === "left" ? "izquierdo" : "derecho"}
        </Text>

        <View
          style={[
            styles.banner,
            params.exceeded ? styles.bannerBad : styles.bannerOk,
          ]}
        >
          <Text style={styles.bannerText}>
            {params.exceeded
              ? "Se superó el límite de % BW"
              : "Dentro del límite configurado"}
          </Text>
        </View>

        <View style={styles.card}>
          {rows.map((row) => (
            <View key={row.label} style={styles.row}>
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Text style={styles.rowValue}>{row.value}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.cta}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.ctaText}>Guardar en Kinecat</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondary}
          onPress={() => navigation.navigate("Home")}
        >
          <Text style={styles.secondaryText}>Volver al inicio</Text>
        </TouchableOpacity>
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  screen: { backgroundColor: "#0f0f0f" },
  content: { flex: 1, paddingHorizontal: 20, paddingBottom: 24, gap: 12 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 8 },
  backText: { color: "#e5e7eb", fontSize: 16 },
  title: { color: "#f9fafb", fontSize: 28, fontWeight: "700" },
  subtitle: { color: "#a3a3a3", fontSize: 15 },
  banner: {
    borderRadius: 12,
    padding: 14,
  },
  bannerOk: { backgroundColor: "#14532d" },
  bannerBad: { backgroundColor: "#7f1d1d" },
  bannerText: { color: "#fef2f2", fontWeight: "700", fontSize: 15 },
  card: {
    backgroundColor: "#171717",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#262626",
    paddingHorizontal: 14,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#262626",
  },
  rowLabel: { color: "#a3a3a3" },
  rowValue: { color: "#f5f5f5", fontWeight: "700" },
  cta: {
    marginTop: 8,
    backgroundColor: "#0891b2",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  ctaText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  secondary: { alignItems: "center", paddingVertical: 10 },
  secondaryText: { color: "#a3a3a3", fontSize: 15 },
});

export default ResultsScreen;
