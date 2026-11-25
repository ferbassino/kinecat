import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuthContext } from "../../../auth/AuthContext";
import ScreenLayout from "../../../components/ScreenLayout";
import ModuleEvaluationContext from "../../../components/evaluation/ModuleEvaluationContext";
import { segments, sides, movements } from "../auxiliaries/selects";
import {
  getCorporalPart,
  requiresSide,
  formatSegmentLabel,
  formatMovementLabel,
  formatSideLabel,
  ARTRO_ACCENT,
  ARTRO_ACCENT_DARK,
} from "../auxiliaries/artroHelpers";
import {
  ARTRO_LIVE_DEFAULT_PORT,
  buildWsUrl,
  parsePairingPayload,
} from "../auxiliaries/artroLivePairing";
import usePlanModuleConfig from "../../../hooks/usePlanModuleConfig";

const SEGMENT_ICONS = {
  cervical: "accessibility-outline",
  trunc: "body-outline",
  shoulder: "fitness-outline",
  elbow: "hand-left-outline",
  forearm: "hand-right-outline",
  wrist: "watch-outline",
  hip: "walk-outline",
  knee: "git-commit-outline",
  ankle: "walk-outline",
  foot: "walk-outline",
};

const STEP_SEGMENT = "segment";
const STEP_SIDE = "side";
const STEP_MOVEMENT = "movement";

const GALLERY_MIN_HEIGHT = 420;

const EvaluationSetupScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { user, currentClient, refreshClients } = useContext(AuthContext);
  const [segment, setSegment] = useState("");
  const [side, setSide] = useState("");
  const [movement, setMovement] = useState("");
  const [step, setStep] = useState(STEP_SEGMENT);
  const [livePair, setLivePair] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanLocked, setScanLocked] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const planConfig = usePlanModuleConfig("artro");
  const selectionTouchedRef = useRef(false);
  const lastClientIdRef = useRef(currentClient?.id || null);

  const sideRequired = requiresSide(segment);
  const corporalPart = getCorporalPart(segment);
  const canStart = Boolean(segment && movement && (!sideRequired || side));

  const segmentOptions = useMemo(
    () =>
      segments.map((item) => ({
        key: item.key,
        value: item.value,
        label: formatSegmentLabel(item.value),
        icon: SEGMENT_ICONS[item.value] || "ellipse-outline",
      })),
    [],
  );

  const sideOptions = useMemo(
    () =>
      sides.map((item) => ({
        key: item.key,
        value: item.value,
        label: formatSideLabel(item.value),
        icon: item.value === "left" ? "arrow-back-outline" : "arrow-forward-outline",
      })),
    [],
  );

  const movementOptions = useMemo(
    () =>
      (movements[segment] || []).map((item) => ({
        key: item.key,
        value: item.value,
        label: formatMovementLabel(item.value),
        icon: "swap-vertical-outline",
      })),
    [segment],
  );

  useEffect(() => {
    if (user?.id) refreshClients();
  }, [user?.id, refreshClients]);

  useEffect(() => {
    const clientId = currentClient?.id || null;
    if (clientId !== lastClientIdRef.current) {
      lastClientIdRef.current = clientId;
      selectionTouchedRef.current = false;
    }

    if (selectionTouchedRef.current) return;

    if (!clientId || !planConfig?.segment) {
      return;
    }

    setSegment(planConfig.segment);
    setSide(planConfig.side || "");
    setMovement(planConfig.movement || "");
    if (requiresSide(planConfig.segment) && !planConfig.side) {
      setStep(STEP_SIDE);
    } else if (!planConfig.movement) {
      setStep(STEP_MOVEMENT);
    } else {
      setStep(STEP_MOVEMENT);
    }
  }, [
    currentClient?.id,
    planConfig?.segment,
    planConfig?.side,
    planConfig?.movement,
  ]);

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

  const goToNextAfterSegment = useCallback((nextSegment) => {
    selectionTouchedRef.current = true;
    setSegment(nextSegment);
    setMovement("");
    if (requiresSide(nextSegment)) {
      setSide("");
      setStep(STEP_SIDE);
    } else {
      setSide("");
      setStep(STEP_MOVEMENT);
    }
  }, []);

  const goToNextAfterSide = useCallback((nextSide) => {
    selectionTouchedRef.current = true;
    setSide(nextSide);
    setStep(STEP_MOVEMENT);
  }, []);

  const selectMovement = useCallback((nextMovement) => {
    selectionTouchedRef.current = true;
    setMovement(nextMovement);
  }, []);

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

    if (parsed.transport === "pusher") {
      setLivePair({
        transport: "pusher",
        token: parsed.token,
        room: parsed.room,
        wsUrl: "",
      });
    } else {
      setLivePair({
        transport: "lan",
        token: "",
        room: parsed.room,
        wsUrl:
          parsed.wsUrl ||
          buildWsUrl(parsed.host, parsed.port || ARTRO_LIVE_DEFAULT_PORT),
      });
    }
    setScanning(false);
  };

  const handleStart = () => {
    if (!canStart) {
      Alert.alert(
        "Campos incompletos",
        "Seleccioná segmento, movimiento" +
          (sideRequired ? " y lado" : "") +
          " antes de continuar.",
      );
      return;
    }

    const payload = {
      segment,
      side,
      movement,
      corporalPart,
    };

    if (livePair?.transport === "pusher" && livePair.token && livePair.room) {
      navigation.navigate("ArtroLiveMeasure", {
        ...payload,
        liveTransport: "pusher",
        liveToken: livePair.token,
        liveRoom: livePair.room,
        liveWsUrl: "",
      });
      return;
    }

    if (livePair?.transport === "lan" && livePair.wsUrl && livePair.room) {
      navigation.navigate("ArtroLiveMeasure", {
        ...payload,
        liveTransport: "lan",
        liveWsUrl: livePair.wsUrl,
        liveRoom: livePair.room,
      });
      return;
    }

    navigation.navigate("ArtroEvaluation", payload);
  };

  const galleryOptions =
    step === STEP_SEGMENT
      ? segmentOptions
      : step === STEP_SIDE
        ? sideOptions
        : movementOptions;

  const galleryTitle =
    step === STEP_SEGMENT
      ? "Segmento"
      : step === STEP_SIDE
        ? "Lado"
        : "Movimiento";

  const onSelectOption = (value) => {
    if (step === STEP_SEGMENT) goToNextAfterSegment(value);
    else if (step === STEP_SIDE) goToNextAfterSide(value);
    else selectMovement(value);
  };

  const selectedValue =
    step === STEP_SEGMENT ? segment : step === STEP_SIDE ? side : movement;

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
            <Text style={styles.headerTitle}>ARTRO</Text>
          </View>
          <Image
            source={require("../../../assets/e_icono.png")}
            style={styles.appIcon}
            resizeMode="contain"
          />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ModuleEvaluationContext
            moduleId="artro"
            accentColor={ARTRO_ACCENT}
            hideConfigBanner
            hideSessionMeta
          />

          <View style={styles.qrCard}>
            <TouchableOpacity
              style={styles.qrCardMain}
              onPress={openScanner}
              activeOpacity={0.8}
            >
              <Ionicons name="qr-code-outline" size={22} color={ARTRO_ACCENT} />
              <View style={styles.qrCardText}>
                <Text style={styles.qrCardTitle}>
                  {livePair ? "QR listo · reescanear" : "Escanear QR"}
                </Text>
                <Text style={styles.qrCardSub}>
                  {livePair
                    ? `Sala ${livePair.room} · selección conservada`
                    : "Conectar con Evaluar → Artro (PC)"}
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

          <View style={styles.stepRow}>
            <TouchableOpacity
              style={[styles.stepChip, step === STEP_SEGMENT && styles.stepChipActive]}
              onPress={() => setStep(STEP_SEGMENT)}
            >
              <Text
                style={[
                  styles.stepChipText,
                  step === STEP_SEGMENT && styles.stepChipTextActive,
                ]}
              >
                {segment ? formatSegmentLabel(segment) : "1 · Segmento"}
              </Text>
            </TouchableOpacity>
            {(sideRequired || side) && (
              <TouchableOpacity
                style={[
                  styles.stepChip,
                  step === STEP_SIDE && styles.stepChipActive,
                  !segment && styles.stepChipDisabled,
                ]}
                disabled={!segment}
                onPress={() => segment && setStep(STEP_SIDE)}
              >
                <Text
                  style={[
                    styles.stepChipText,
                    step === STEP_SIDE && styles.stepChipTextActive,
                  ]}
                >
                  {side ? formatSideLabel(side) : "2 · Lado"}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.stepChip,
                step === STEP_MOVEMENT && styles.stepChipActive,
                !segment && styles.stepChipDisabled,
              ]}
              disabled={!segment || (sideRequired && !side)}
              onPress={() => {
                if (!segment) return;
                if (sideRequired && !side) return;
                setStep(STEP_MOVEMENT);
              }}
            >
              <Text
                style={[
                  styles.stepChipText,
                  step === STEP_MOVEMENT && styles.stepChipTextActive,
                ]}
              >
                {movement ? formatMovementLabel(movement) : "3 · Movimiento"}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>{galleryTitle.toUpperCase()}</Text>
          <View style={styles.galleryShell}>
            <ScrollView
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.galleryList}
            >
              {galleryOptions.map((option) => {
                const selected = selectedValue === option.value;
                return (
                  <TouchableOpacity
                    key={String(option.key ?? option.value)}
                    style={[
                      styles.galleryCard,
                      { borderLeftColor: ARTRO_ACCENT },
                      selected && styles.galleryCardSelected,
                    ]}
                    onPress={() => onSelectOption(option.value)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.galleryContent}>
                      <Ionicons
                        name={option.icon}
                        size={28}
                        color={ARTRO_ACCENT}
                        style={styles.galleryIcon}
                      />
                      <Text style={styles.galleryName}>{option.label}</Text>
                    </View>
                    <Ionicons
                      name={selected ? "checkmark-circle" : "chevron-forward"}
                      size={20}
                      color={selected ? ARTRO_ACCENT : "rgba(255,255,255,0.5)"}
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {canStart ? (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Resumen</Text>
              <Text style={styles.summaryText}>
                {formatSegmentLabel(segment)} · {formatMovementLabel(movement)}
                {side ? ` · ${formatSideLabel(side)}` : ""}
              </Text>
              {corporalPart ? (
                <Text style={styles.summaryMeta}>{corporalPart}</Text>
              ) : null}
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.startButton, !canStart && styles.disabledButton]}
            onPress={handleStart}
            disabled={!canStart}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={canStart ? [ARTRO_ACCENT, ARTRO_ACCENT_DARK] : ["#444", "#333"]}
              style={styles.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.buttonText}>
                {livePair ? "INICIAR CON PC" : "INICIAR MEDICIÓN"}
              </Text>
              <Ionicons name="play" size={20} color="white" />
            </LinearGradient>
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
              <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
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
  appIcon: { width: 32, height: 32, tintColor: ARTRO_ACCENT, marginRight: 8 },
  scrollContent: { padding: 24, paddingBottom: 16 },
  qrCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "rgba(20, 184, 166, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(20, 184, 166, 0.35)",
  },
  qrCardMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  qrClearBtn: { marginLeft: 8 },
  qrCardText: { flex: 1 },
  qrCardTitle: { color: ARTRO_ACCENT, fontWeight: "800", fontSize: 15 },
  qrCardSub: { color: "#94a3b8", fontSize: 12, marginTop: 2 },
  stepRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  stepChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  stepChipActive: {
    backgroundColor: "rgba(20, 184, 166, 0.16)",
    borderColor: "rgba(20, 184, 166, 0.45)",
  },
  stepChipDisabled: { opacity: 0.4 },
  stepChipText: { color: "rgba(255,255,255,0.55)", fontSize: 12, fontWeight: "700" },
  stepChipTextActive: { color: ARTRO_ACCENT },
  sectionTitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 4,
  },
  galleryShell: {
    minHeight: GALLERY_MIN_HEIGHT,
    height: GALLERY_MIN_HEIGHT,
    marginBottom: 16,
  },
  galleryList: {
    paddingBottom: 8,
  },
  galleryCard: {
    backgroundColor: "#2c2c2c",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  galleryCardSelected: {
    borderWidth: 1,
    borderColor: "rgba(20, 184, 166, 0.4)",
    backgroundColor: "rgba(20, 184, 166, 0.08)",
  },
  galleryContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 8,
  },
  galleryIcon: { marginRight: 16 },
  galleryName: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "500",
    flexShrink: 1,
  },
  summaryCard: {
    backgroundColor: "rgba(20, 184, 166, 0.1)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(20, 184, 166, 0.3)",
  },
  summaryTitle: {
    color: ARTRO_ACCENT,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: 8,
  },
  summaryText: { color: "#ffffff", fontSize: 16, fontWeight: "500" },
  summaryMeta: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    marginTop: 4,
  },
  startButton: { borderRadius: 14, overflow: "hidden", marginTop: 8 },
  disabledButton: { opacity: 0.6 },
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
    backgroundColor: ARTRO_ACCENT,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  permissionBtnText: { color: "#fff", fontWeight: "800" },
});

export default EvaluationSetupScreen;
