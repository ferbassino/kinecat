import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Accelerometer } from "expo-sensors";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import useCmjLiveSocket from "../../jump/hooks/useCmjLiveSocket";
import usePusherLiveSensor from "../../jump/hooks/usePusherLiveSensor";
import AtrGibbositySvg from "../components/AtrGibbositySvg";
import {
  ATR_MAX_DEG,
  ATR_THRESHOLDS,
  atrSideLabel,
  atrZone,
  computeAtrDegrees,
  createAtrEma,
  detectPhonePose,
  smoothAtrSeries,
} from "../auxiliaries/computeAtr";
import { ATR_ACCENT, ATR_ACCENT_DARK } from "./AtrLivePairScreen";

const LIVE_BATCH_MS = 50;
const SENSOR_MS = 40;

/**
 * Vista apaisada con borde izquierdo del teléfono hacia abajo.
 * rotate 90°: IZQ/cámara → extremo cámara · DER/USB → base.
 */
const AtrMeasureScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const forceSideways = height >= width;
  const stageW = forceSideways ? height : width;
  const stageH = forceSideways ? width : height;

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

  const [atr, setAtr] = useState(0);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [finished, setFinished] = useState(false);
  const [peakAbs, setPeakAbs] = useState(0);
  const [peakSigned, setPeakSigned] = useState(0);
  const [sampleCount, setSampleCount] = useState(0);
  const [seriesSnapshot, setSeriesSnapshot] = useState([]);
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
  const atrEmaRef = useRef(createAtrEma(0.45));

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

  liveSendRef.current = liveSend;

  const stopAccelerometer = () => {
    if (accelSubRef.current) {
      accelSubRef.current.remove();
      accelSubRef.current = null;
    }
  };

  const resetToReady = useCallback(() => {
    isMeasuringRef.current = false;
    setIsMeasuring(false);
    setFinished(false);
    setSeriesSnapshot([]);
    seriesRef.current = [];
    liveBatchRef.current = [];
    t0Ref.current = null;
    peakAbsRef.current = 0;
    peakSignedRef.current = 0;
    atrEmaRef.current = createAtrEma(0.45);
    setPeakAbs(0);
    setPeakSigned(0);
    setSampleCount(0);
    setAtr(0);
    // Avisa a la PC para limpiar curva / giba / resultado.
    liveSend({ type: "reset" });
    liveSend({ type: "status", phase: "idle" });
  }, [liveSend]);

  const startMeasurement = useCallback(() => {
    if (isMeasuringRef.current) return;
    isMeasuringRef.current = true;
    setIsMeasuring(true);
    setFinished(false);
    setSeriesSnapshot([]);
    seriesRef.current = [];
    liveBatchRef.current = [];
    t0Ref.current = Date.now();
    peakAbsRef.current = 0;
    peakSignedRef.current = 0;
    atrEmaRef.current = createAtrEma(0.45);
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
    flushLiveBatch();

    const rawSeries = seriesRef.current;
    const series = smoothAtrSeries(rawSeries, 3);
    let peak = 0;
    let signed = 0;
    for (const p of series) {
      const abs = Math.abs(Number(p.atr) || 0);
      if (abs > peak) {
        peak = abs;
        signed = Number(p.atr) || 0;
      }
    }
    peakAbsRef.current = peak;
    peakSignedRef.current = signed;
    setPeakAbs(peak);
    setPeakSigned(signed);
    setSeriesSnapshot(series);
    setFinished(true);

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

      const rawDeg = computeAtrDegrees(data);
      const deg = atrEmaRef.current(rawDeg);
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
  const connected = !liveEnabled || liveOpen;

  // Con rotate 90° (borde izquierdo abajo):
  // stage left = cámara · stage right = USB · stage bottom = borde izquierdo
  const stagePad = forceSideways
    ? {
        paddingTop: Math.max(insets.right, 8),
        paddingBottom: Math.max(insets.left, 20),
        paddingLeft: Math.max(insets.top, 12),
        paddingRight: Math.max(insets.bottom, 12),
      }
    : {
        paddingTop: insets.top + 6,
        paddingBottom: Math.max(insets.bottom + 20, 28),
        paddingLeft: insets.left + 14,
        paddingRight: insets.right + 14,
      };

  const connectChip = (
    <View style={styles.connectRow}>
      {liveEnabled ? (
        <>
          <View
            style={[
              styles.dot,
              { backgroundColor: connected ? "#22c55e" : "#ef4444" },
            ]}
          />
          <Text style={styles.connectText}>
            {connected ? "Conectado" : "Sin conexión"}
          </Text>
          {!liveOpen ? (
            <TouchableOpacity onPress={liveConnect} hitSlop={8}>
              <Text style={styles.reconnectLink}>Reconectar</Text>
            </TouchableOpacity>
          ) : null}
        </>
      ) : (
        <Text style={styles.connectText}>Solo celular</Text>
      )}
    </View>
  );

  const measureBody = finished ? (
    <View style={[styles.doneRoot, stagePad]}>
      <View style={styles.doneHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={20} color="white" />
        </TouchableOpacity>
        <Text style={styles.doneTitle}>Resultado ATR</Text>
        {connectChip}
      </View>

      <View style={styles.gibaHero}>
        <AtrGibbositySvg data={seriesSnapshot} peakAbs={peakAbs} />
      </View>

      <View style={styles.miniStats}>
        <View style={styles.miniStat}>
          <Text style={styles.miniValue}>{peakAbs.toFixed(1)}°</Text>
          <Text style={styles.miniLabel}>Pico</Text>
        </View>
        <View style={styles.miniStat}>
          <Text style={styles.miniValue}>{atrSideLabel(peakSigned)}</Text>
          <Text style={styles.miniLabel}>Lado</Text>
        </View>
        <View style={styles.miniStat}>
          <Text style={styles.miniValue}>{atrZone(peakAbs)}</Text>
          <Text style={styles.miniLabel}>Zona</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.bigBtn, styles.bigBtnStart]}
        onPress={resetToReady}
        activeOpacity={0.85}
      >
        <Text style={styles.bigBtnText}>NUEVO BARRIDO</Text>
      </TouchableOpacity>
    </View>
  ) : (
    <View style={[styles.liveRoot, stagePad]}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={18} color="white" />
        </TouchableOpacity>
        {connectChip}
      </View>

      {/* Fila apaisada: IZQ(cámara) · ATR · DER(USB); botones arriba de cada lado */}
      <View style={styles.landscapeRow}>
        <View style={styles.sideRail}>
          <TouchableOpacity
            style={[
              styles.sideBtn,
              isMeasuring ? styles.bigBtnStop : styles.bigBtnStart,
            ]}
            onPress={() =>
              isMeasuring ? stopMeasurement() : startMeasurement()
            }
            activeOpacity={0.85}
          >
            <Ionicons
              name={isMeasuring ? "stop" : "play"}
              size={18}
              color="#f8fafc"
            />
            <Text style={styles.sideBtnText}>
              {isMeasuring ? "FINALIZAR" : "COMENZAR"}
            </Text>
          </TouchableOpacity>
          <Text style={styles.sideIzq}>IZQ (−)</Text>
          <Text style={styles.sideHint}>cámara</Text>
        </View>

        <View style={styles.centerCol}>
          <View style={[styles.gauge, { borderColor: zoneColor }]}>
            <Text style={styles.gaugeLabel}>ATR actual</Text>
            <Text style={[styles.gaugeValue, { color: zoneColor }]}>
              {atr.toFixed(1)}°
            </Text>
            <Text style={styles.gaugeSide}>{atrSideLabel(atr)}</Text>
            <Text style={styles.gaugeRange}>±{ATR_MAX_DEG}°</Text>
          </View>

          <Text
            style={[styles.poseChip, poseOk ? styles.poseOk : styles.poseBad]}
          >
            {poseOk ? "Orientación OK" : "Borde izquierdo abajo"}
          </Text>

          {isMeasuring ? (
            <Text style={styles.livePeak}>
              Pico {peakAbs.toFixed(1)}° · {sampleCount} muestras
            </Text>
          ) : null}
        </View>

        <View style={styles.sideRail}>
          <TouchableOpacity
            style={[
              styles.sideBtn,
              isMeasuring ? styles.bigBtnStop : styles.bigBtnStart,
            ]}
            onPress={() =>
              isMeasuring ? stopMeasurement() : startMeasurement()
            }
            activeOpacity={0.85}
          >
            <Ionicons
              name={isMeasuring ? "stop" : "play"}
              size={18}
              color="#f8fafc"
            />
            <Text style={styles.sideBtnText}>
              {isMeasuring ? "FINALIZAR" : "COMENZAR"}
            </Text>
          </TouchableOpacity>
          <Text style={styles.sideDer}>DER (+)</Text>
          <Text style={styles.sideHint}>base · USB</Text>
        </View>
      </View>
    </View>
  );

  return (
    <LinearGradient colors={["#0f0f0f", "#1a1a1a"]} style={styles.container}>
      <View style={styles.sidewaysHost}>
        <View
          style={[
            styles.sidewaysStage,
            { width: stageW, height: stageH },
            forceSideways ? styles.sidewaysRotated : null,
          ]}
        >
          {measureBody}
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  sidewaysHost: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  sidewaysStage: {
    backgroundColor: "transparent",
  },
  sidewaysRotated: {
    // Borde izquierdo del teléfono hacia abajo.
    transform: [{ rotate: "90deg" }],
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  liveRoot: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  landscapeRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sideRail: {
    width: 96,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  sideBtn: {
    width: "100%",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  sideBtnText: {
    color: "#f8fafc",
    fontWeight: "900",
    fontSize: 11,
    letterSpacing: 0.4,
    textAlign: "center",
  },
  sideIzq: {
    color: "#67e8f9",
    fontWeight: "900",
    fontSize: 15,
    letterSpacing: 0.8,
    textAlign: "center",
  },
  sideDer: {
    color: "#f9a8d4",
    fontWeight: "900",
    fontSize: 15,
    letterSpacing: 0.8,
    textAlign: "center",
  },
  sideHint: {
    color: "#64748b",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    textAlign: "center",
  },
  centerCol: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  connectRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  connectText: { color: "#e2e8f0", fontSize: 12, fontWeight: "700" },
  reconnectLink: {
    color: ATR_ACCENT,
    fontSize: 12,
    fontWeight: "800",
    marginLeft: 6,
  },
  gauge: {
    minWidth: 200,
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 18,
    borderWidth: 2,
    backgroundColor: "rgba(15,23,42,0.7)",
  },
  gaugeLabel: {
    color: "#94a3b8",
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    fontSize: 11,
  },
  gaugeValue: { fontSize: 56, fontWeight: "900", marginTop: 2 },
  gaugeSide: { color: "#cbd5e1", fontWeight: "700", marginTop: 2, fontSize: 14 },
  gaugeRange: { color: "#64748b", fontSize: 12, marginTop: 2 },
  poseChip: {
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: "hidden",
  },
  poseOk: {
    color: "#bbf7d0",
    backgroundColor: "rgba(74,222,128,0.15)",
  },
  poseBad: {
    color: "#fde68a",
    backgroundColor: "rgba(251,191,36,0.15)",
  },
  livePeak: { color: "#94a3b8", fontSize: 12, fontWeight: "600" },
  bigBtn: {
    alignSelf: "center",
    minWidth: 220,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 4,
  },
  bigBtnStart: { backgroundColor: ATR_ACCENT_DARK },
  bigBtnStop: { backgroundColor: "#b91c1c" },
  bigBtnText: {
    color: "#f8fafc",
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 0.6,
  },
  doneRoot: { flex: 1 },
  doneHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  doneTitle: { color: "#f8fafc", fontWeight: "800", fontSize: 16 },
  gibaHero: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  miniStats: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginVertical: 10,
  },
  miniStat: { alignItems: "center", minWidth: 72 },
  miniValue: { color: "#f8fafc", fontWeight: "900", fontSize: 18 },
  miniLabel: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
    textTransform: "uppercase",
  },
});

export default AtrMeasureScreen;
