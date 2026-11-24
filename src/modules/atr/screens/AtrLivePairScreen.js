import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import {
  ATR_LIVE_DEFAULT_PORT,
  buildWsUrl,
  parsePairingPayload,
} from "../auxiliaries/atrLivePairing";

const AtrLivePairScreen = ({ navigation }) => {
  const [host, setHost] = useState("");
  const [port, setPort] = useState(String(ATR_LIVE_DEFAULT_PORT));
  const [room, setRoom] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanLocked, setScanLocked] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const wsUrl = useMemo(() => {
    const h = String(host || "").trim();
    if (!h) return "";
    return buildWsUrl(h, Number(port) || ATR_LIVE_DEFAULT_PORT);
  }, [host, port]);

  const canContinue = Boolean(wsUrl) && String(room).trim().length === 4;

  const applyPairing = useCallback((parsed) => {
    if (!parsed) {
      Alert.alert(
        "QR inválido",
        "Escaneá el QR de Evaluar → Escoliómetro · ATR en la PC.",
      );
      return false;
    }
    setHost(parsed.host);
    setPort(String(parsed.port || ATR_LIVE_DEFAULT_PORT));
    setRoom(parsed.room);
    return true;
  }, []);

  const goLive = useCallback(
    (override) => {
      const nextHost = override?.host || host;
      const nextPort = override?.port || Number(port) || ATR_LIVE_DEFAULT_PORT;
      const nextRoom = String(override?.room || room)
        .trim()
        .toUpperCase();
      const nextWs = override?.wsUrl || buildWsUrl(nextHost, nextPort);
      if (!nextWs || nextRoom.length !== 4) return;
      navigation.navigate("AtrMeasure", {
        liveWsUrl: nextWs,
        liveRoom: nextRoom,
      });
    },
    [host, navigation, port, room],
  );

  const openScanner = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          "Cámara",
          "Necesitamos permiso de cámara para escanear el QR de la PC.",
        );
        return;
      }
    }
    setScanLocked(false);
    setScanning(true);
  };

  const onBarcodeScanned = ({ data }) => {
    if (scanLocked) return;
    setScanLocked(true);
    const parsed = parsePairingPayload(data);
    if (!applyPairing(parsed)) {
      setScanLocked(false);
      return;
    }
    setScanning(false);
    goLive(parsed);
  };

  return (
    <LinearGradient colors={["#0f0f0f", "#1a1a1a"]} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={20} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ATR · PC live</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.lead}>
          Misma Wi‑Fi que la PC. Relay: npm run cmj-live · Evaluar →
          Escoliómetro · ATR. Escaneá el QR o completá a mano.
        </Text>

        <TouchableOpacity style={styles.scanCta} onPress={openScanner}>
          <Ionicons name="qr-code-outline" size={22} color="#ecfeff" />
          <Text style={styles.scanCtaText}>Escanear QR de la PC</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.offlineCta}
          onPress={() => navigation.navigate("AtrMeasure", {})}
        >
          <Text style={styles.offlineCtaText}>Medir sin PC (solo celular)</Text>
        </TouchableOpacity>

        <Text style={styles.label}>IP / host de la PC</Text>
        <TextInput
          style={styles.input}
          value={host}
          onChangeText={setHost}
          placeholder="192.168.0.89"
          placeholderTextColor="#64748b"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="numbers-and-punctuation"
        />

        <Text style={styles.label}>Puerto</Text>
        <TextInput
          style={styles.input}
          value={port}
          onChangeText={setPort}
          placeholder={String(ATR_LIVE_DEFAULT_PORT)}
          placeholderTextColor="#64748b"
          keyboardType="number-pad"
        />

        <Text style={styles.label}>Sala (4 caracteres)</Text>
        <TextInput
          style={styles.input}
          value={room}
          onChangeText={(t) => setRoom(t.toUpperCase())}
          placeholder="AB12"
          placeholderTextColor="#64748b"
          autoCapitalize="characters"
          maxLength={4}
          autoCorrect={false}
        />

        <Text style={styles.url}>{wsUrl || "ws://…"}</Text>

        <TouchableOpacity
          style={[styles.cta, !canContinue && styles.ctaDisabled]}
          disabled={!canContinue}
          onPress={() => goLive()}
        >
          <Text style={styles.ctaText}>Continuar al escoliómetro</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={scanning}
        animationType="slide"
        onRequestClose={() => setScanning(false)}
      >
        <View style={styles.scannerRoot}>
          <View style={styles.scannerHeader}>
            <TouchableOpacity
              onPress={() => setScanning(false)}
              style={styles.backButton}
            >
              <Ionicons name="close" size={22} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Escanear QR</Text>
          </View>
          {permission?.granted ? (
            <CameraView
              style={styles.camera}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={scanLocked ? undefined : onBarcodeScanned}
            />
          ) : (
            <View style={styles.permissionBox}>
              <Text style={styles.permissionText}>Sin permiso de cámara.</Text>
              <TouchableOpacity style={styles.cta} onPress={requestPermission}>
                <Text style={styles.ctaText}>Permitir cámara</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
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
  headerTitle: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "800",
  },
  content: { padding: 20, gap: 8 },
  lead: { color: "#94a3b8", marginBottom: 12, lineHeight: 20 },
  scanCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#7c3aed",
    borderRadius: 14,
    paddingVertical: 16,
    marginBottom: 8,
  },
  scanCtaText: { color: "#f5f3ff", fontWeight: "800", fontSize: 16 },
  offlineCta: {
    alignItems: "center",
    paddingVertical: 10,
    marginBottom: 8,
  },
  offlineCtaText: { color: "#a78bfa", fontWeight: "700" },
  label: {
    color: "#c4b5fd",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginTop: 8,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.35)",
    borderRadius: 12,
    color: "#f8fafc",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: "600",
  },
  url: { marginTop: 10, color: "#cbd5e1", fontFamily: "monospace" },
  cta: {
    marginTop: 18,
    backgroundColor: "#6d28d9",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  ctaDisabled: { opacity: 0.45 },
  ctaText: { color: "#f5f3ff", fontWeight: "800", fontSize: 16 },
  scannerRoot: { flex: 1, backgroundColor: "#0f0f0f" },
  scannerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  camera: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: "hidden",
  },
  permissionBox: { flex: 1, justifyContent: "center", padding: 24, gap: 12 },
  permissionText: { color: "#cbd5e1", textAlign: "center" },
});

export default AtrLivePairScreen;
