import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ARTRO_LIVE_DEFAULT_PORT,
  buildWsUrl,
  parsePairingPayload,
} from "../auxiliaries/artroLivePairing";
import { ARTRO_ACCENT_DARK } from "../auxiliaries/artroHelpers";

/**
 * Pantalla residual: solo escaneo QR.
 * Devuelve a ArtroEvaluationSetup con los params live sin pisar la selección.
 */
const ArtroLivePairScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [scanning, setScanning] = useState(false);
  const [scanLocked, setScanLocked] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const returnToSetup = useCallback(
    (parsed) => {
      if (!parsed) {
        Alert.alert(
          "QR inválido",
          "Escaneá el QR de Evaluar → Artro · goniometría.",
        );
        return;
      }

      if (parsed.transport === "pusher" && parsed.token && parsed.room) {
        navigation.navigate("ArtroEvaluationSetup", {
          liveTransport: "pusher",
          liveToken: parsed.token,
          liveRoom: parsed.room,
          liveWsUrl: "",
        });
        return;
      }

      const nextWs =
        parsed.wsUrl ||
        buildWsUrl(parsed.host, parsed.port || ARTRO_LIVE_DEFAULT_PORT);
      if (!nextWs || !parsed.room) return;
      navigation.navigate("ArtroEvaluationSetup", {
        liveTransport: "lan",
        liveWsUrl: nextWs,
        liveRoom: parsed.room,
      });
    },
    [navigation],
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
    if (!parsed) {
      setScanLocked(false);
      Alert.alert(
        "QR inválido",
        "Escaneá el QR de Evaluar → Artro · goniometría.",
      );
      return;
    }
    setScanning(false);
    returnToSetup(parsed);
  };

  return (
    <LinearGradient colors={["#0f0f0f", "#1a1a1a"]} style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={() => navigation.navigate("ArtroEvaluationSetup")}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={20} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Artro · PC live</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.lead}>
          Escaneá el QR de la PC. Volvés al setup con la selección intacta.
        </Text>

        <TouchableOpacity style={styles.scanCta} onPress={openScanner}>
          <Ionicons name="qr-code-outline" size={22} color="#ecfeff" />
          <Text style={styles.scanCtaText}>Escanear QR de la PC</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={scanning}
        animationType="slide"
        onRequestClose={() => setScanning(false)}
      >
        <View style={styles.scannerRoot}>
          <View style={[styles.scannerHeader, { paddingTop: insets.top + 12 }]}>
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
              <Text style={styles.permissionText}>
                Sin permiso de cámara.
              </Text>
              <TouchableOpacity style={styles.scanCta} onPress={requestPermission}>
                <Text style={styles.scanCtaText}>Permitir cámara</Text>
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
    backgroundColor: ARTRO_ACCENT_DARK,
    borderRadius: 14,
    paddingVertical: 16,
    marginBottom: 10,
  },
  scanCtaText: { color: "#ecfeff", fontWeight: "800", fontSize: 15 },
  scannerRoot: { flex: 1, backgroundColor: "#0f0f0f" },
  scannerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  camera: { flex: 1 },
  permissionBox: { flex: 1, justifyContent: "center", padding: 24 },
  permissionText: { color: "#94a3b8", marginBottom: 16, textAlign: "center" },
});

export default ArtroLivePairScreen;
