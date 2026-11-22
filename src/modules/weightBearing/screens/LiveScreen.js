import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenLayout from "../../../components/ScreenLayout";
import usePlateWebSocket from "../hooks/usePlateWebSocket";
import { BODY_WEIGHT_KG, DEFAULT_LIMIT_PCT_BW } from "../constants";

const LiveScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const bodyWeightKg = route.params?.bodyWeightKg ?? BODY_WEIGHT_KG;
  const limitPctBw = route.params?.limitPctBw ?? DEFAULT_LIMIT_PCT_BW;
  const side = route.params?.side || "right";

  const { status, lastSample, error, connect } = usePlateWebSocket({
    enabled: true,
  });

  const [capturing, setCapturing] = useState(false);
  const [peakLoadKg, setPeakLoadKg] = useState(0);
  const [peakPctBw, setPeakPctBw] = useState(0);
  const [timeOverLimitMs, setTimeOverLimitMs] = useState(0);
  const [sampleCount, setSampleCount] = useState(0);
  const [sawSim, setSawSim] = useState(false);
  const startedAtRef = useRef(null);
  const lastTickRef = useRef(null);

  const loadKg = lastSample?.loadKg ?? 0;
  const pctBw = bodyWeightKg > 0 ? (loadKg / bodyWeightKg) * 100 : 0;
  const exceeded = pctBw > limitPctBw;
  const progress = Math.min(1, pctBw / Math.max(limitPctBw, 1));

  useEffect(() => {
    if (!capturing || !lastSample) return;

    setSampleCount((n) => n + 1);
    if (lastSample.sim) setSawSim(true);

    if (loadKg > peakLoadKg) setPeakLoadKg(loadKg);
    if (pctBw > peakPctBw) setPeakPctBw(pctBw);

    const now = Date.now();
    if (lastTickRef.current == null) {
      lastTickRef.current = now;
      return;
    }
    const dt = now - lastTickRef.current;
    lastTickRef.current = now;
    if (exceeded && dt > 0 && dt < 500) {
      setTimeOverLimitMs((ms) => ms + dt);
    }
  }, [capturing, lastSample, loadKg, pctBw, peakLoadKg, peakPctBw, exceeded]);

  const statusLabel = useMemo(() => {
    if (error) return error;
    if (status === "connecting") return "Conectando a la placa…";
    if (status === "open") return "Conectado";
    if (status === "closed") return "Desconectado";
    if (status === "error") return "Error de conexión";
    return "Sin conexión";
  }, [status, error]);

  const handleToggleCapture = () => {
    if (!capturing) {
      setPeakLoadKg(0);
      setPeakPctBw(0);
      setTimeOverLimitMs(0);
      setSampleCount(0);
      setSawSim(false);
      startedAtRef.current = Date.now();
      lastTickRef.current = null;
      setCapturing(true);
      return;
    }

    setCapturing(false);
    const durationMs = startedAtRef.current
      ? Date.now() - startedAtRef.current
      : 0;
    navigation.navigate("WeightBearingResults", {
      bodyWeightKg,
      limitPctBw,
      side,
      peakLoadKg: Math.max(peakLoadKg, loadKg),
      peakPctBw: Math.max(peakPctBw, pctBw),
      timeOverLimitMs,
      exceeded: peakPctBw > limitPctBw || pctBw > limitPctBw || timeOverLimitMs > 0,
      durationMs,
      sampleCount,
      sim: sawSim || Boolean(lastSample?.sim),
      lastLoadKg: loadKg,
      lastPctBw: pctBw,
    });
  };

  return (
    <ScreenLayout
      style={[styles.screen, exceeded && styles.screenAlert]}
      topInset
    >
      <View style={[styles.content, { paddingTop: Math.max(insets.top, 12) }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color="#e5e7eb" />
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>

        <Text style={[styles.title, exceeded && styles.textAlert]}>
          Carga en vivo
        </Text>
        <Text style={styles.meta}>
          Pie {side === "left" ? "izquierdo" : "derecho"} · PC {bodyWeightKg} kg ·
          límite {limitPctBw}%
        </Text>

        <View style={styles.statusRow}>
          <View
            style={[
              styles.dot,
              status === "open" ? styles.dotOk : styles.dotBad,
            ]}
          />
          <Text style={styles.statusText}>{statusLabel}</Text>
          {status !== "open" ? (
            <TouchableOpacity onPress={connect} style={styles.retry}>
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={[styles.gaugeCard, exceeded && styles.gaugeAlert]}>
          <Text style={[styles.pctValue, exceeded && styles.textAlert]}>
            {pctBw.toFixed(1)}%
          </Text>
          <Text style={styles.pctLabel}>del peso corporal</Text>
          <Text style={[styles.kgValue, exceeded && styles.textAlert]}>
            {loadKg.toFixed(1)} kg
          </Text>

          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                { width: `${Math.round(progress * 100)}%` },
                exceeded && styles.barAlert,
              ]}
            />
          </View>
          <Text style={styles.barCaption}>
            Barra llena = límite ({limitPctBw}% BW)
          </Text>

          {exceeded ? (
            <Text style={styles.alertBanner}>Límite superado</Text>
          ) : (
            <Text style={styles.okBanner}>Dentro del límite</Text>
          )}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Pico</Text>
            <Text style={styles.statValue}>{peakPctBw.toFixed(1)}%</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Sobre límite</Text>
            <Text style={styles.statValue}>
              {(timeOverLimitMs / 1000).toFixed(1)} s
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Muestras</Text>
            <Text style={styles.statValue}>{sampleCount}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.cta, capturing && styles.ctaStop]}
          onPress={handleToggleCapture}
        >
          <Text style={styles.ctaText}>
            {capturing ? "Detener y ver resultados" : "Empezar captura"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  screen: { backgroundColor: "#0f0f0f" },
  screenAlert: { backgroundColor: "#450a0a" },
  content: { flex: 1, paddingHorizontal: 20, paddingBottom: 24, gap: 12 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 8 },
  backText: { color: "#e5e7eb", fontSize: 16 },
  title: { color: "#f9fafb", fontSize: 26, fontWeight: "700" },
  textAlert: { color: "#fecaca" },
  meta: { color: "#a3a3a3", fontSize: 14 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dotOk: { backgroundColor: "#22c55e" },
  dotBad: { backgroundColor: "#f59e0b" },
  statusText: { color: "#d4d4d4", flex: 1 },
  retry: { paddingHorizontal: 8, paddingVertical: 4 },
  retryText: { color: "#22d3ee", fontWeight: "600" },
  gaugeCard: {
    marginTop: 8,
    backgroundColor: "#171717",
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: "#262626",
    alignItems: "center",
    gap: 6,
  },
  gaugeAlert: {
    backgroundColor: "#7f1d1d",
    borderColor: "#ef4444",
  },
  pctValue: { color: "#22d3ee", fontSize: 64, fontWeight: "800" },
  pctLabel: { color: "#a3a3a3", fontSize: 14 },
  kgValue: { color: "#f9fafb", fontSize: 28, fontWeight: "700", marginTop: 4 },
  barTrack: {
    marginTop: 16,
    width: "100%",
    height: 14,
    borderRadius: 999,
    backgroundColor: "#262626",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: "#22d3ee",
  },
  barAlert: { backgroundColor: "#f87171" },
  barCaption: { color: "#737373", fontSize: 12, marginTop: 6 },
  alertBanner: {
    marginTop: 10,
    color: "#fee2e2",
    fontWeight: "800",
    fontSize: 16,
  },
  okBanner: {
    marginTop: 10,
    color: "#a7f3d0",
    fontWeight: "700",
    fontSize: 15,
  },
  statsRow: { flexDirection: "row", gap: 10 },
  stat: {
    flex: 1,
    backgroundColor: "#171717",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#262626",
  },
  statLabel: { color: "#737373", fontSize: 12 },
  statValue: { color: "#f5f5f5", fontSize: 18, fontWeight: "700", marginTop: 4 },
  cta: {
    marginTop: "auto",
    backgroundColor: "#0891b2",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  ctaStop: { backgroundColor: "#b91c1c" },
  ctaText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});

export default LiveScreen;
