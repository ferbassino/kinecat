import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Accelerometer } from "expo-sensors";
import { Ionicons } from "@expo/vector-icons";
import useCmjLiveSocket from "../../jump/hooks/useCmjLiveSocket";
import PhoneRestGuide from "../components/PhoneRestGuide";
import {
  ATR_MAX_DEG,
  ATR_THRESHOLDS,
  atrSideLabel,
  atrZone,
  computeAtrDegrees,
  detectPhonePose,
} from "../auxiliaries/computeAtr";

const LIVE_BATCH_MS = 50;
const SENSOR_MS = 40;

const PROCEDURE_STEPS = [
  "Flexión de Adams: espalda relajada y visible.",
  "Seguí la flecha: apoyá el borde marcado en la espalda (móvil de costado).",
  "USB hacia los pies · mirando la pantalla: IZQ paciente = ATR − · DER = ATR +.",
  "Deslizá lumbar → dorsal y mirá el pico |ATR|.",
];

const AtrMeasureScreen = ({ route, navigation }) => {
  const liveWsUrl = route.params?.liveWsUrl || "";
  const liveRoom = route.params?.liveRoom || "";
  const liveEnabled = Boolean(liveWsUrl && liveRoom);

  const [atr, setAtr] = useState(0);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [showInfo, setShowInfo] = useState(true);
  const [peakAbs, setPeakAbs] = useState(0);
  const [peakSigned, setPeakSigned] = useState(0);
  const [sampleCount, setSampleCount] = useState(0);
  const [poseHint, setPoseHint] = useState("");
  const [poseOk, setPoseOk] = useState(false);

  const isMeasuringRef = useRef(false);
  const atrRef = useRef(0);
  const peakAbsRef = useRef(0);
  const peakSignedRef = useRef(0);
  const seriesRef = useRef([]);
  const t0Ref = useRef(null);
  const liveBatchRef = useRef([]);
  const liveBatchTimerRef = useRef(null);
  const accelSubRef = useRef(null);
  const liveSendRef = useRef(null);
  const startRef = useRef(null);
  const stopRef = useRef(null);

  const flushLiveBatch = useCallback(() => {
    if (!liveSendRef.current || !liveBatchRef.current.length) return;
    const samples = liveBatchRef.current;
    liveBatchRef.current = [];
    liveSendRef.current({ type: "sample_batch", samples });
  }, []);

  const handleLiveCommand = useCallback((action) => {
    if (action === "start") {
      startRef.current?.();
      return;
    }
    if (action === "stop") {
      stopRef.current?.();
    }
  }, []);

  const {
    status: liveStatus,
    error: liveError,
    roomState: liveRoomState,
    send: liveSend,
    connect: liveConnect,
    isOpen: liveOpen,
  } = useCmjLiveSocket({
    url: liveWsUrl,
    room: liveRoom,
    enabled: liveEnabled,
    onCommand: handleLiveCommand,
  });

  liveSendRef.current = liveSend;

  const stopAccelerometer = () => {
    if (accelSubRef.current) {
      accelSubRef.current.remove();
      accelSubRef.current = null;
    }
  };

  const startMeasurement = useCallback(() => {
    if (isMeasuringRef.current) return;
    isMeasuringRef.current = true;
    setIsMeasuring(true);
    setShowInfo(false);
    seriesRef.current = [];
    liveBatchRef.current = [];
    t0Ref.current = Date.now();
    peakAbsRef.current = 0;
    peakSignedRef.current = 0;
    setPeakAbs(0);
    setPeakSigned(0);
    setSampleCount(0);
    liveSend({ type: "status", phase: "measuring" });
    liveSend({
      type: "sensor_info",
      deviceName: "Expo",
      mode: "atr",
      room: liveRoom,
    });
  }, [liveRoom, liveSend]);

  const stopMeasurement = useCallback(() => {
    if (!isMeasuringRef.current) return;
    isMeasuringRef.current = false;
    setIsMeasuring(false);
    stopAccelerometer();
    if (liveBatchTimerRef.current) {
      clearInterval(liveBatchTimerRef.current);
      liveBatchTimerRef.current = null;
    }
    flushLiveBatch();

    const series = seriesRef.current;
    const peak = peakAbsRef.current;
    const signed = peakSignedRef.current;
    liveSend({
      type: "result",
      mode: "atr",
      sampleCount: series.length,
      peakAtrAbs: Number(peak.toFixed(1)),
      peakAtrSigned: Number(signed.toFixed(1)),
      peakSide: atrSideLabel(signed),
      zone: atrZone(peak),
      thresholds: ATR_THRESHOLDS,
      jumpHint: `Pico ATR ${peak.toFixed(1)}° · ${atrSideLabel(signed)}`,
      charts: {
        atr: {
          t: series.map((p) => p.sec),
          a: series.map((p) => p.atr),
        },
      },
      metrics: {
        peakAtrAbs: Number(peak.toFixed(1)),
        peakAtrSigned: Number(signed.toFixed(1)),
        peakSide: atrSideLabel(signed),
        zone: atrZone(peak),
        durationSec: series.length
          ? Number(series[series.length - 1].sec.toFixed(2))
          : 0,
      },
    });
    liveSend({ type: "status", phase: "done" });
  }, [flushLiveBatch, liveSend]);

  startRef.current = startMeasurement;
  stopRef.current = stopMeasurement;

  useEffect(() => {
    Accelerometer.setUpdateInterval(SENSOR_MS);
    accelSubRef.current = Accelerometer.addListener((data) => {
      const pose = detectPhonePose(data);
      setPoseOk(pose.ok);
      setPoseHint(pose.hint);

      const deg = computeAtrDegrees(data);
      atrRef.current = deg;
      setAtr(deg);

      if (!isMeasuringRef.current) return;

      const now = Date.now();
      if (!t0Ref.current) t0Ref.current = now;
      const sec = (now - t0Ref.current) / 1000;
      const point = {
        sec: Math.round(sec * 1000) / 1000,
        atr: Math.round(deg * 10) / 10,
      };
      seriesRef.current.push(point);
      setSampleCount(seriesRef.current.length);

      const abs = Math.abs(deg);
      if (abs > peakAbsRef.current) {
        peakAbsRef.current = abs;
        peakSignedRef.current = deg;
        setPeakAbs(abs);
        setPeakSigned(deg);
      }

      if (liveEnabled) {
        liveBatchRef.current.push([now, point.atr]);
      }
    });

    if (liveEnabled) {
      liveBatchTimerRef.current = setInterval(flushLiveBatch, LIVE_BATCH_MS);
    }

    return () => {
      stopAccelerometer();
      if (liveBatchTimerRef.current) {
        clearInterval(liveBatchTimerRef.current);
        liveBatchTimerRef.current = null;
      }
    };
  }, [flushLiveBatch, liveEnabled]);

  useEffect(() => {
    if (!liveOpen) return;
    liveSend({
      type: "sensor_info",
      deviceName: "Expo",
      mode: "atr",
      room: liveRoom,
    });
  }, [liveOpen, liveRoom, liveSend]);

  const zone = atrZone(Math.abs(atr));
  const zoneColor =
    zone === "ok" ? "#4ade80" : zone === "watch" ? "#fbbf24" : "#f87171";

  return (
    <LinearGradient colors={["#0f0f0f", "#1a1a1a"]} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.navigate("Home")}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={20} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>HOME</Text>
        <Image
          source={require("../../../assets/e_icono.png")}
          style={styles.appIcon}
          resizeMode="contain"
        />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Escoliómetro · ATR</Text>
        <Text style={styles.subtitle}>
          Ángulo de rotación del tronco · prueba de Adams
        </Text>

        {liveEnabled ? (
          <View style={styles.liveBanner}>
            <Text style={styles.liveBannerTitle}>
              PC live · sala {liveRoom}
            </Text>
            <Text style={styles.liveBannerText}>
              WS {liveStatus}
              {liveOpen ? ` · viewers ${liveRoomState.viewers}` : ""}
              {liveError ? ` · ${liveError}` : ""}
            </Text>
            {!liveOpen ? (
              <TouchableOpacity
                style={styles.reconnect}
                onPress={liveConnect}
              >
                <Text style={styles.reconnectText}>Reconectar</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.liveHint}>
                Podés iniciar desde el celular o desde la PC.
              </Text>
            )}
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.infoToggle}
          onPress={() => setShowInfo((v) => !v)}
        >
          <Ionicons
            name="information-circle-outline"
            size={18}
            color="#c4b5fd"
          />
          <Text style={styles.infoToggleText}>
            {showInfo ? "Ocultar procedimiento" : "Mostrar procedimiento"}
          </Text>
        </TouchableOpacity>

        {showInfo ? (
          <View style={styles.infoCard}>
            {PROCEDURE_STEPS.map((step, i) => (
              <Text key={step} style={styles.infoStep}>
                {i + 1}. {step}
              </Text>
            ))}
            <Text style={styles.infoLimit}>
              Limitaciones: cribado/seguimiento; no reemplaza radiografía ni
              evaluación clínica. Precisión según sensores; quitá fundas gruesas
              y mantené el teléfono nivelado y bien apoyado. Umbrales
              orientativos: &lt;{ATR_THRESHOLDS.mild}° ok ·{" "}
              {ATR_THRESHOLDS.mild}–{ATR_THRESHOLDS.refer}° vigilancia · ≥
              {ATR_THRESHOLDS.refer}° derivación habitual en literatura de
              screening.
            </Text>
          </View>
        ) : null}

        <PhoneRestGuide />

        <View
          style={[
            styles.poseBanner,
            poseOk ? styles.poseBannerOk : styles.poseBannerBad,
          ]}
        >
          <Ionicons
            name={poseOk ? "checkmark-circle-outline" : "warning-outline"}
            size={18}
            color={poseOk ? "#4ade80" : "#fbbf24"}
          />
          <Text
            style={[
              styles.poseBannerText,
              { color: poseOk ? "#bbf7d0" : "#fde68a" },
            ]}
          >
            {poseHint || "Colocá el móvil de costado…"}
          </Text>
        </View>

        <View style={[styles.gauge, { borderColor: zoneColor }]}>
          <Text style={styles.gaugeLabel}>ATR actual</Text>
          <Text style={[styles.gaugeValue, { color: zoneColor }]}>
            {atr.toFixed(1)}°
          </Text>
          <Text style={styles.gaugeSide}>{atrSideLabel(atr)}</Text>
          <View style={styles.sideLegend}>
            <Text style={styles.sideLegendIzq}>← IZQ (−)</Text>
            <Text style={styles.sideLegendDer}>DER (+) →</Text>
          </View>
          <Text style={styles.gaugeRange}>±{ATR_MAX_DEG}°</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{peakAbs.toFixed(1)}°</Text>
            <Text style={styles.statLabel}>Pico |ATR|</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{atrSideLabel(peakSigned)}</Text>
            <Text style={styles.statLabel}>Lado del pico</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{sampleCount}</Text>
            <Text style={styles.statLabel}>Muestras</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.primaryBtn, isMeasuring && styles.primaryBtnStop]}
          onPress={() =>
            isMeasuring ? stopMeasurement() : startMeasurement()
          }
        >
          <Text style={styles.primaryBtnText}>
            {isMeasuring ? "DETENER BARRIDO" : "COMENZAR BARRIDO"}
          </Text>
          <Ionicons
            name={isMeasuring ? "stop" : "play"}
            size={18}
            color="#f8fafc"
          />
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  headerTitle: { color: "#f8fafc", fontSize: 16, fontWeight: "700", flex: 1 },
  appIcon: { width: 28, height: 28 },
  scroll: { padding: 20, paddingBottom: 40, gap: 10 },
  title: { color: "#f8fafc", fontSize: 22, fontWeight: "800" },
  subtitle: { color: "#94a3b8", marginBottom: 6 },
  liveBanner: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(124, 58, 237, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(167, 139, 250, 0.45)",
    gap: 4,
  },
  liveBannerTitle: { color: "#ddd6fe", fontWeight: "800" },
  liveBannerText: { color: "#c4b5fd", fontSize: 13 },
  liveHint: { color: "#a78bfa", fontSize: 12, marginTop: 4 },
  reconnect: {
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: "#6d28d9",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  reconnectText: { color: "#fff", fontWeight: "700" },
  infoToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  infoToggleText: { color: "#c4b5fd", fontWeight: "700" },
  infoCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  infoStep: { color: "#e2e8f0", lineHeight: 20, fontSize: 13 },
  infoLimit: {
    color: "#94a3b8",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  gauge: {
    marginTop: 8,
    alignItems: "center",
    paddingVertical: 22,
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: "rgba(15,23,42,0.65)",
  },
  gaugeLabel: {
    color: "#94a3b8",
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    fontSize: 12,
  },
  gaugeValue: { fontSize: 56, fontWeight: "800", marginTop: 4 },
  gaugeSide: { color: "#cbd5e1", fontWeight: "600", marginTop: 2 },
  sideLegend: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 18,
    marginTop: 8,
  },
  sideLegendIzq: { color: "#67e8f9", fontWeight: "800", fontSize: 12 },
  sideLegendDer: { color: "#f9a8d4", fontWeight: "800", fontSize: 12 },
  gaugeRange: { color: "#64748b", fontSize: 12, marginTop: 6 },
  poseBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  poseBannerOk: {
    backgroundColor: "rgba(74, 222, 128, 0.12)",
    borderColor: "rgba(74, 222, 128, 0.35)",
  },
  poseBannerBad: {
    backgroundColor: "rgba(251, 191, 36, 0.12)",
    borderColor: "rgba(251, 191, 36, 0.4)",
  },
  poseBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17,
  },
  statsRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  stat: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
  },
  statValue: { color: "#f8fafc", fontWeight: "800", fontSize: 15 },
  statLabel: {
    color: "#94a3b8",
    fontSize: 11,
    marginTop: 4,
    textAlign: "center",
  },
  primaryBtn: {
    marginTop: 14,
    backgroundColor: "#7c3aed",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  primaryBtnStop: { backgroundColor: "#b91c1c" },
  primaryBtnText: { color: "#f8fafc", fontWeight: "800", fontSize: 16 },
});

export default AtrMeasureScreen;
