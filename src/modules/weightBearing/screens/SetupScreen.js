import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenLayout from "../../../components/ScreenLayout";
import {
  BODY_WEIGHT_KG,
  DEFAULT_LIMIT_PCT_BW,
  MAX_LIMIT_PCT_BW,
  MIN_LIMIT_PCT_BW,
  PLATE_AP_PASS,
  PLATE_AP_SSID,
  PLATE_STATUS_URL,
} from "../constants";

const SetupScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [limitText, setLimitText] = useState(String(DEFAULT_LIMIT_PCT_BW));
  const [side, setSide] = useState("right");

  const limitPctBw = useMemo(() => {
    const n = Number(limitText);
    if (!Number.isFinite(n)) return DEFAULT_LIMIT_PCT_BW;
    return Math.min(MAX_LIMIT_PCT_BW, Math.max(MIN_LIMIT_PCT_BW, n));
  }, [limitText]);

  const handleStart = () => {
    navigation.navigate("WeightBearingLive", {
      bodyWeightKg: BODY_WEIGHT_KG,
      limitPctBw,
      side,
    });
  };

  return (
    <ScreenLayout style={styles.screen} topInset>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: Math.max(insets.top, 12) },
        ]}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color="#e5e7eb" />
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Descarga de peso</Text>
        <Text style={styles.subtitle}>
          Un pie sobre la balanza · % del peso corporal
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>Peso corporal (hardcode)</Text>
          <Text style={styles.bigValue}>{BODY_WEIGHT_KG} kg</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Límite de % peso corporal</Text>
          <View style={styles.row}>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={limitText}
              onChangeText={setLimitText}
              placeholder={`${DEFAULT_LIMIT_PCT_BW}`}
              placeholderTextColor="#6b7280"
            />
            <Text style={styles.suffix}>% BW</Text>
          </View>
          <Text style={styles.hint}>
            Si la carga supera este % , la pantalla pasa a rojo.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Pie</Text>
          <View style={styles.sideRow}>
            {[
              { key: "left", label: "Izquierdo" },
              { key: "right", label: "Derecho" },
            ].map((option) => {
              const active = side === option.key;
              return (
                <TouchableOpacity
                  key={option.key}
                  style={[styles.sideBtn, active && styles.sideBtnActive]}
                  onPress={() => setSide(option.key)}
                >
                  <Text
                    style={[styles.sideText, active && styles.sideTextActive]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Conexión a la placa</Text>
          <Text style={styles.step}>1. Unite al WiFi «{PLATE_AP_SSID}»</Text>
          <Text style={styles.step}>2. Contraseña: {PLATE_AP_PASS}</Text>
          <Text style={styles.step}>
            3. Opcional: abrí {PLATE_STATUS_URL} y verificá sim
          </Text>
          <Text style={styles.hint}>
            Al unirte al SoftAP el celular puede perder internet; guardá el
            resultado después de volver a tu WiFi.
          </Text>
        </View>

        <TouchableOpacity style={styles.cta} onPress={handleStart}>
          <Text style={styles.ctaText}>Iniciar medición</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  screen: { backgroundColor: "#0f0f0f" },
  content: { paddingHorizontal: 20, paddingBottom: 32, gap: 14 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  backText: { color: "#e5e7eb", fontSize: 16 },
  title: { color: "#f9fafb", fontSize: 28, fontWeight: "700" },
  subtitle: { color: "#9ca3af", fontSize: 15, marginBottom: 6 },
  card: {
    backgroundColor: "#171717",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#262626",
    gap: 8,
  },
  label: { color: "#a3a3a3", fontSize: 13, textTransform: "uppercase", letterSpacing: 0.6 },
  bigValue: { color: "#22d3ee", fontSize: 36, fontWeight: "700" },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  input: {
    flex: 1,
    backgroundColor: "#0f0f0f",
    borderWidth: 1,
    borderColor: "#404040",
    borderRadius: 10,
    color: "#f9fafb",
    fontSize: 22,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  suffix: { color: "#e5e7eb", fontSize: 18, fontWeight: "600" },
  hint: { color: "#737373", fontSize: 13, lineHeight: 18 },
  sideRow: { flexDirection: "row", gap: 10 },
  sideBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#404040",
    paddingVertical: 12,
    alignItems: "center",
  },
  sideBtnActive: { backgroundColor: "#164e63", borderColor: "#22d3ee" },
  sideText: { color: "#a3a3a3", fontWeight: "600" },
  sideTextActive: { color: "#ecfeff" },
  step: { color: "#e5e7eb", fontSize: 14, lineHeight: 20 },
  cta: {
    marginTop: 8,
    backgroundColor: "#0891b2",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  ctaText: { color: "#ecfeff", fontSize: 17, fontWeight: "700" },
});

export default SetupScreen;
