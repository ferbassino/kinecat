import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuthContext } from "../../../auth/AuthContext";
import ScreenLayout from "../../../components/ScreenLayout";
import ModuleEvaluationContext from "../../../components/evaluation/ModuleEvaluationContext";
import {
  ATR_LIVE_DEFAULT_PORT,
  buildWsUrl,
  parsePairingPayload,
} from "../auxiliaries/atrLivePairing";

export const ATR_ACCENT = "#38bdf8";
export const ATR_ACCENT_DARK = "#0284c7";

const AtrLivePairScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { user, refreshClients } = useContext(AuthContext);
  const [livePair, setLivePair] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanLocked, setScanLocked] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (user?.id) refreshClients();
  }, [user?.id, refreshClients]);

  useEffect(() => {
    const params = route?.params;
    if (!params?.liveTransport && !params?.liveRoom) return;

    if (params.liveTransport === "pusher" && params.liveToken && params.liveRoom) {
      setLivePair({
        transport: "pusher",
        token: params.liveToken,
        room: String(params.liveRoom).toUpperCase(),
        wsUrl: "",
      });
    } else if (params.liveWsUrl && params.liveRoom) {
      setLivePair({
        transport: "lan",
        token: "",
        room: String(params.liveRoom).toUpperCase(),
        wsUrl: params.liveWsUrl,
      });
    }

    navigation.setParams({
      liveTransport: undefined,
      liveToken: undefined,
      liveRoom: undefined,
      liveWsUrl: undefined,
    });
  }, [navigation, route?.params]);

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

  const applyParsed = useCallback((parsed) => {
    if (!parsed) {
      Alert.alert(
        "QR inválido",
        "Escaneá el QR de Evaluar → Escoliómetro · ATR.",
      );
      return false;
    }
    if (parsed.transport === "pusher") {
      setLivePair({
        transport: "pusher",
        token: parsed.token,
        room: parsed.room,
        wsUrl: "",
      });
      return true;
    }
    setLivePair({
      transport: "lan",
      token: "",
      room: parsed.room,
      wsUrl:
        parsed.wsUrl ||
        buildWsUrl(parsed.host, parsed.port || ATR_LIVE_DEFAULT_PORT),
    });
    return true;
  }, []);

  const onBarcodeScanned = ({ data }) => {
    if (scanLocked) return;
    setScanLocked(true);
    const parsed = parsePairingPayload(data);
    if (!applyParsed(parsed)) {
      setScanLocked(false);
      return;
    }
    setScanning(false);
  };

  const goMeasure = (withLive) => {
    if (!withLive) {
      navigation.navigate("AtrMeasure", {});
      return;
    }
    if (livePair?.transport === "pusher" && livePair.token && livePair.room) {
      navigation.navigate("AtrMeasure", {
        liveTransport: "pusher",
        liveToken: livePair.token,
        liveRoom: livePair.room,
        liveWsUrl: "",
      });
      return;
    }
    if (livePair?.transport === "lan" && livePair.wsUrl && livePair.room) {
      navigation.navigate("AtrMeasure", {
        liveTransport: "lan",
        liveWsUrl: livePair.wsUrl,
        liveRoom: livePair.room,
      });
      return;
    }
    Alert.alert("Sin QR", "Escaneá el QR de la PC o medí sin PC.");
  };

  return (
    <LinearGradient colors={["#0f0f0f", "#1a1a1a"]} style={styles.container}>
      <ScreenLayout bottomInset>
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <View style={styles.headerButton}>
            <TouchableOpacity
              onPress={() => navigation.navigate("Home")}
              style={styles.backButton}
            >
              <Ionicons name="chevron-back" size={20} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>ESCOLIÓMETRO</Text>
          </View>
          <Image
            source={require("../../../assets/e_icono.png")}
            style={styles.appIcon}
            resizeMode="contain"
          />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ModuleEvaluationContext
            moduleId="atr"
            accentColor={ATR_ACCENT}
            hideConfigBanner
            hideSessionMeta
          />

          <View style={styles.qrCard}>
            <TouchableOpacity
              style={styles.qrCardMain}
              onPress={openScanner}
              activeOpacity={0.8}
            >
              <Ionicons name="qr-code-outline" size={22} color={ATR_ACCENT} />
              <View style={styles.qrCardText}>
                <Text style={styles.qrCardTitle}>
                  {livePair ? "QR listo · reescanear" : "Escanear QR"}
                </Text>
                <Text style={styles.qrCardSub}>
                  {livePair
                    ? `Sala ${livePair.room} · listo para medir`
                    : "Conectar con Evaluar → ATR (PC)"}
                </Text>
              </View>
              {!livePair ? (
                <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
              ) : null}
            </TouchableOpacity>
            {livePair ? (
              <TouchableOpacity
                onPress={() => setLivePair(null)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.qrClearBtn}
              >
                <Ionicons name="close-circle" size={20} color="#94a3b8" />
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={20} color={ATR_ACCENT} />
            <Text style={styles.infoText}>
              Prueba de Adams · ATR. Escaneá el QR de la PC o medí solo con el
              celular.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.startButton, !livePair && styles.startButtonMuted]}
            onPress={() => goMeasure(true)}
            disabled={!livePair}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={
                livePair
                  ? [ATR_ACCENT, ATR_ACCENT_DARK]
                  : ["#444", "#333"]
              }
              style={styles.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.buttonText}>INICIAR CON PC</Text>
              <Ionicons name="desktop-outline" size={20} color="white" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.offlineBtn}
            onPress={() => goMeasure(false)}
            activeOpacity={0.8}
          >
            <Text style={styles.offlineBtnText}>Medir sin PC (solo celular)</Text>
          </TouchableOpacity>
        </ScrollView>
      </ScreenLayout>

      <Modal
        visible={scanning}
        animationType="slide"
        onRequestClose={() => setScanning(false)}
      >
        <View style={styles.scannerRoot}>
          <View style={[styles.scannerHeader, { paddingTop: insets.top + 12 }]}>
            <TouchableOpacity
              onPress={() => setScanning(false)}
              style={styles.scannerClose}
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
                Sin permiso de cámara. Activá el acceso para escanear el QR.
              </Text>
              <TouchableOpacity
                style={styles.permissionBtn}
                onPress={requestPermission}
              >
                <Text style={styles.permissionBtnText}>Permitir cámara</Text>
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  headerButton: { flexDirection: "row", alignItems: "center" },
  backButton: { marginRight: 16 },
  headerTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  appIcon: { width: 32, height: 32, tintColor: ATR_ACCENT, marginRight: 8 },
  scrollContent: { padding: 24, paddingBottom: 24 },
  qrCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "rgba(56, 189, 248, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.35)",
  },
  qrCardMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  qrClearBtn: { marginLeft: 8 },
  qrCardText: { flex: 1 },
  qrCardTitle: { color: ATR_ACCENT, fontWeight: "800", fontSize: 15 },
  qrCardSub: { color: "#94a3b8", fontSize: 12, marginTop: 2 },
  infoCard: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    padding: 14,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    lineHeight: 19,
  },
  startButton: { borderRadius: 14, overflow: "hidden" },
  startButtonMuted: { opacity: 0.7 },
  gradient: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  offlineBtn: {
    marginTop: 14,
    alignItems: "center",
    paddingVertical: 12,
  },
  offlineBtnText: {
    color: ATR_ACCENT,
    fontWeight: "700",
    fontSize: 14,
  },
  scannerRoot: { flex: 1, backgroundColor: "#0f0f0f" },
  scannerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  scannerClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  camera: { flex: 1 },
  permissionBox: { flex: 1, justifyContent: "center", padding: 24 },
  permissionText: { color: "#94a3b8", marginBottom: 16, textAlign: "center" },
  permissionBtn: {
    alignSelf: "center",
    backgroundColor: ATR_ACCENT,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  permissionBtnText: { color: "#fff", fontWeight: "800" },
});

export default AtrLivePairScreen;
