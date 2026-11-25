import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Gyroscope } from "expo-sensors";
import { Ionicons } from "@expo/vector-icons";
import EvaluationMeasurementBlock from "../../../components/EvaluationMeasurementBlock";
import { useEvaluationCommands } from "../../../hooks/useEvaluationCommands";
import useCmjLiveSocket from "../../jump/hooks/useCmjLiveSocket";
import usePusherLiveSensor from "../../jump/hooks/usePusherLiveSensor";
import {
  ARTRO_AXIS_X,
  pickGyroRate,
  resolveArtroAxis,
} from "../auxiliaries/artroAxis";
import {
  TEST_TIME_MS,
  formatMovementLabel,
  formatSegmentLabel,
  formatSideLabel,
  ARTRO_ACCENT,
} from "../auxiliaries/artroHelpers";

const ACCENT = ARTRO_ACCENT;
const LIVE_BATCH_MS = 50;
const PRE_GO_LEAD_MS = 350;
const MEASUREMENT_DURATION_MS = TEST_TIME_MS;
const MEASUREMENT_DURATION_S = Math.ceil(MEASUREMENT_DURATION_MS / 1000);

const packSeries = (arr) => {
  if (!Array.isArray(arr) || !arr.length) return [];
  return arr.map((n) => {
    const v = Number(n);
    return Number.isFinite(v) ? Math.round(v * 100) / 100 : 0;
  });
};

const ArtroLiveMeasureScreen = ({ route, navigation }) => {
  const liveWsUrl = route.params?.liveWsUrl || "";
  const liveRoom = route.params?.liveRoom || "";
  const liveToken = route.params?.liveToken || "";
  const liveTransport =
    route.params?.liveTransport ||
    (liveToken ? "pusher" : liveWsUrl ? "lan" : "");
  const liveCloudEnabled =
    liveTransport === "pusher" && Boolean(liveToken && liveRoom);
  const liveLanEnabled =
    liveTransport !== "pusher" && Boolean(liveWsUrl && liveRoom);
  const liveEnabled = liveCloudEnabled || liveLanEnabled;

  const localSelectionLocked = Boolean(
    route.params?.segment && route.params?.movement,
  );
  const [segment, setSegment] = useState(route.params?.segment || "shoulder");
  const [side, setSide] = useState(route.params?.side || "");
  const [movement, setMovement] = useState(route.params?.movement || "flexion");
  const [axis, setAxis] = useState(
    () => resolveArtroAxis(route.params?.movement || "flexion"),
  );

  const [isMeasuring, setIsMeasuring] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(MEASUREMENT_DURATION_S);
  const [liveAngle, setLiveAngle] = useState(0);

  const isMeasuringRef = useRef(false);
  const startTimeRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const gyroSubRef = useRef(null);
  const angleRef = useRef(0);
  const lastSampleRef = useRef(null);
  const seriesRef = useRef([]);
  const liveBatchRef = useRef([]);
  const liveBatchTimerRef = useRef(null);
  const liveSendRef = useRef(null);
  const startRef = useRef(null);
  const stopRef = useRef(null);
  const axisRef = useRef(axis);
  const configRef = useRef({ segment, side, movement, axis });

  axisRef.current = axis;
  configRef.current = { segment, side, movement, axis };

  const { cue, emit, runStartSequence } = useEvaluationCommands({
    accentColor: ACCENT,
  });

  const applyConfig = useCallback(
    (msg = {}) => {
      // Si el setup ya eligió segmento/movimiento, no pisar con la PC.
      if (localSelectionLocked) {
        if (msg.axis === "x" || msg.axis === "y") {
          setAxis(msg.axis);
          axisRef.current = msg.axis;
        }
        return;
      }
      if (msg.segment) setSegment(String(msg.segment));
      if (msg.side != null) setSide(String(msg.side));
      if (msg.movement) {
        const nextMovement = String(msg.movement);
        setMovement(nextMovement);
        const nextAxis = msg.axis || resolveArtroAxis(nextMovement);
        setAxis(nextAxis);
        axisRef.current = nextAxis;
      } else if (msg.axis === "x" || msg.axis === "y") {
        setAxis(msg.axis);
        axisRef.current = msg.axis;
      }
    },
    [localSelectionLocked],
  );

  const flushLiveBatch = useCallback(() => {
    if (!liveSendRef.current || !liveBatchRef.current.length) return;
    const samples = liveBatchRef.current;
    liveBatchRef.current = [];
    liveSendRef.current({ type: "sample_batch", samples });
  }, []);

  const handleLiveCommand = useCallback(
    (action, msg = {}) => {
      if (action === "config") {
        applyConfig(msg);
        return;
      }
      if (action === "start") {
        applyConfig(msg);
        startRef.current?.();
        return;
      }
      if (action === "stop") {
        stopRef.current?.();
      }
    },
    [applyConfig],
  );

  const lanLive = useCmjLiveSocket({
    url: liveWsUrl,
    room: liveRoom,
    enabled: liveLanEnabled,
    onCommand: handleLiveCommand,
  });
  const cloudLive = usePusherLiveSensor({
    room: liveRoom,
    token: liveToken,
    enabled: liveCloudEnabled,
    onCommand: handleLiveCommand,
  });

  const liveSend = liveCloudEnabled ? cloudLive.send : lanLive.send;
  const liveConnect = liveCloudEnabled ? cloudLive.connect : lanLive.connect;
  const liveOpen = liveCloudEnabled ? cloudLive.isOpen : lanLive.isOpen;
  const liveStatus = liveCloudEnabled ? cloudLive.status : lanLive.status;
  const liveError = liveCloudEnabled ? cloudLive.error : lanLive.error;
  const liveHostLabel = liveCloudEnabled
    ? "cloud"
    : String(liveWsUrl).replace(/^ws:\/\//i, "").split(":")[0] || "—";

  liveSendRef.current = liveSend;

  const clearMeasurementTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const stopGyro = () => {
    if (gyroSubRef.current) {
      gyroSubRef.current.remove();
      gyroSubRef.current = null;
    }
  };

  const resetToReady = useCallback(() => {
    clearMeasurementTimer();
    stopGyro();
    if (liveBatchTimerRef.current) {
      clearInterval(liveBatchTimerRef.current);
      liveBatchTimerRef.current = null;
    }
    isMeasuringRef.current = false;
    setIsMeasuring(false);
    setIsStarting(false);
    setIsProcessing(false);
    setTimeLeft(MEASUREMENT_DURATION_S);
    liveSend({ type: "status", phase: "idle" });
  }, [liveSend]);

  const finishWithData = async () => {
    stopGyro();
    if (liveBatchTimerRef.current) {
      clearInterval(liveBatchTimerRef.current);
      liveBatchTimerRef.current = null;
    }
    flushLiveBatch();
    await emit("FINISHED", { accentColor: ACCENT });
    setIsProcessing(true);
    liveSend({ type: "status", phase: "processing" });

    const series = [...seriesRef.current];
    const cfg = configRef.current;
    const peakAbs = series.reduce(
      (max, row) => Math.max(max, Math.abs(Number(row.angle) || 0)),
      0,
    );
    const finalAngle = angleRef.current;

    if (!series.length) {
      const message = "Sin datos del giroscopio. Reintentá la prueba.";
      liveSend({ type: "error", code: "no_data", message });
      Alert.alert("Sin datos", message, [{ text: "OK", onPress: resetToReady }]);
      resetToReady();
      return;
    }

    const t0 = series[0].t;
    liveSend({
      type: "result",
      sampleCount: series.length,
      peakAbs,
      finalAngle,
      segment: cfg.segment,
      side: cfg.side,
      movement: cfg.movement,
      axis: cfg.axis,
      hint: `Artro · ${Math.abs(finalAngle).toFixed(1)}° (pico ${peakAbs.toFixed(1)}°)`,
      charts: {
        angle: {
          t: packSeries(series.map((s) => (s.t - t0) / 1000)),
          a: packSeries(series.map((s) => s.angle)),
        },
      },
    });
    liveSend({ type: "status", phase: "done" });
    setIsProcessing(false);
    isMeasuringRef.current = false;
    setIsMeasuring(false);
  };

  const stopMeasurement = async () => {
    if (!isMeasuringRef.current) return;
    isMeasuringRef.current = false;
    setIsMeasuring(false);
    clearMeasurementTimer();
    await finishWithData();
  };

  const startMeasurement = async () => {
    if (isMeasuring || isProcessing || isStarting) return;

    angleRef.current = 0;
    lastSampleRef.current = null;
    seriesRef.current = [];
    liveBatchRef.current = [];
    setLiveAngle(0);
    setTimeLeft(MEASUREMENT_DURATION_S);
    setIsProcessing(false);
    setIsMeasuring(false);
    isMeasuringRef.current = false;
    setIsStarting(true);
    liveSend({ type: "status", phase: "countdown" });

    try {
      await runStartSequence({
        accentColor: ACCENT,
        preGoLeadMs: PRE_GO_LEAD_MS,
        onBeforeGo: async () => {
          setIsStarting(false);
          startTimeRef.current = Date.now();
          isMeasuringRef.current = true;
          setIsMeasuring(true);
          liveSend({
            type: "status",
            phase: "measuring",
            timeLeft: MEASUREMENT_DURATION_S,
          });
        },
      });
    } catch (err) {
      console.warn("Artro start sequence:", err);
      resetToReady();
    }
  };

  startRef.current = startMeasurement;
  stopRef.current = stopMeasurement;

  useEffect(() => {
    (async () => {
      const { status } = await Gyroscope.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permiso requerido",
          "Se necesita acceso al giroscopio para medir.",
        );
        navigation.goBack();
      }
    })();
    return () => {
      clearMeasurementTimer();
      stopGyro();
    };
  }, [navigation]);

  useEffect(() => {
    if (!liveOpen) return;
    const cfg = configRef.current;
    liveSend({
      type: "sensor_info",
      mode: "artro",
      deviceName: "Expo",
      segment: cfg.segment,
      side: cfg.side,
      movement: cfg.movement,
      axis: cfg.axis || ARTRO_AXIS_X,
      room: liveRoom,
    });
  }, [liveOpen, liveRoom, liveSend, segment, side, movement, axis]);

  useEffect(() => {
    const onGyro = (sample) => {
      const ts = Date.now();
      const rate = pickGyroRate(sample, axisRef.current);
      const prev = lastSampleRef.current;
      lastSampleRef.current = { t: ts, rate };

      if (!prev) return;
      const dt = Math.max(0, (ts - prev.t) / 1000);
      if (dt <= 0 || dt > 0.2) return;

      const dRad = ((prev.rate + rate) * dt) / 2;
      const dDeg = (dRad * 180) / Math.PI;
      angleRef.current += dDeg;
      const angle = angleRef.current;
      setLiveAngle(angle);
      seriesRef.current.push({ t: ts, angle });

      if (liveEnabled) {
        liveBatchRef.current.push([ts, Math.round(angle * 100) / 100]);
      }
    };

    if (isMeasuring) {
      Gyroscope.setUpdateInterval(10);
      gyroSubRef.current = Gyroscope.addListener(onGyro);
      if (liveEnabled) {
        liveBatchTimerRef.current = setInterval(flushLiveBatch, LIVE_BATCH_MS);
      }
    }

    return () => {
      stopGyro();
      if (liveBatchTimerRef.current) {
        clearInterval(liveBatchTimerRef.current);
        liveBatchTimerRef.current = null;
      }
    };
  }, [flushLiveBatch, isMeasuring, liveEnabled]);

  useEffect(() => {
    if (!isMeasuring) {
      clearMeasurementTimer();
      return;
    }
    startTimeRef.current = Date.now();
    timerIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, MEASUREMENT_DURATION_MS - elapsed);
      const secs = Math.ceil(remaining / 1000);
      setTimeLeft(secs);
      if (liveEnabled) {
        liveSend({ type: "status", phase: "measuring", timeLeft: secs });
      }
      if (remaining <= 0) {
        clearMeasurementTimer();
        stopRef.current?.();
      }
    }, 250);
    return () => clearMeasurementTimer();
  }, [isMeasuring, liveEnabled, liveSend]);

  return (
    <LinearGradient colors={["#0f0f0f", "#1a1a1a"]} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          disabled={isMeasuring || isStarting}
        >
          <Ionicons name="chevron-back" size={20} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Artro live</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {liveEnabled ? (
          <View style={styles.liveBox}>
            <View style={styles.liveStatusRow}>
              <View
                style={[
                  styles.liveStatusDot,
                  { backgroundColor: liveOpen ? "#22c55e" : "#ef4444" },
                ]}
              />
              <Text style={styles.liveStatusText}>
                {liveHostLabel} · {liveStatus || "…"}
              </Text>
            </View>
            {liveError ? (
              <Text style={styles.liveError}>{String(liveError)}</Text>
            ) : null}
            {!liveOpen ? (
              <TouchableOpacity style={styles.reconnectBtn} onPress={liveConnect}>
                <Text style={styles.reconnectText}>Reconectar</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.liveOk}>Conectado a la PC</Text>
            )}
          </View>
        ) : (
          <Text style={styles.liveError}>
            Faltan datos del QR. Volvé a escanear desde Artro → Escanear QR.
          </Text>
        )}

        <View style={styles.metaCard}>
          <Text style={styles.metaTitle}>
            {formatSegmentLabel(segment)} · {formatMovementLabel(movement)}
          </Text>
          <Text style={styles.metaSub}>
            {side ? `${formatSideLabel(side)} · ` : ""}
            {axis === "y" ? "Eje Y (rotación)" : "Eje X (flexo / abd)"}
          </Text>
        </View>

        <View style={styles.angleCard}>
          <Text style={styles.angleValue}>
            {Math.abs(liveAngle).toFixed(1)}°
          </Text>
          <Text style={styles.angleHint}>Ángulo principal en vivo</Text>
        </View>

        <EvaluationMeasurementBlock
          accentColor={ACCENT}
          cue={cue}
          timeLeft={timeLeft}
          isMeasuring={isMeasuring}
          isProcessing={isProcessing}
          isStarting={isStarting}
          onStart={startMeasurement}
          onStop={stopMeasurement}
          secondaryAction={{
            label: "VOLVER",
            onPress: () => navigation.goBack(),
          }}
        />
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  headerTitle: { color: "#f8fafc", fontSize: 18, fontWeight: "800" },
  content: { padding: 20, paddingBottom: 40 },
  liveBox: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(20,184,166,0.25)",
    gap: 8,
  },
  liveStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
  },
  liveStatusDot: { width: 10, height: 10, borderRadius: 5 },
  liveStatusText: { color: "#e2e8f0", fontSize: 13, fontWeight: "600" },
  liveError: { color: "#fca5a5", fontSize: 13, fontWeight: "600" },
  liveOk: { color: "#86efac", fontSize: 13, fontWeight: "700" },
  reconnectBtn: {
    alignSelf: "flex-start",
    backgroundColor: ARTRO_ACCENT,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  reconnectText: { color: "#ecfeff", fontWeight: "800", fontSize: 13 },
  metaCard: {
    backgroundColor: "rgba(20,184,166,0.12)",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(20,184,166,0.35)",
  },
  metaTitle: { color: "#99f6e4", fontWeight: "800", fontSize: 16 },
  metaSub: { color: "#5eead4", marginTop: 4, fontSize: 13 },
  angleCard: {
    alignItems: "center",
    paddingVertical: 18,
    marginBottom: 14,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  angleValue: {
    color: ARTRO_ACCENT,
    fontSize: 48,
    fontWeight: "900",
    letterSpacing: -1,
  },
  angleHint: { color: "#94a3b8", marginTop: 4, fontWeight: "600" },
});

export default ArtroLiveMeasureScreen;
