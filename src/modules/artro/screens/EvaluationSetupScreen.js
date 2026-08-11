import React, { useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuthContext } from "../../../auth/AuthContext";
import SelectField from "../components/SelectField";
import ScreenLayout from "../../../components/ScreenLayout";
import ModuleEvaluationContext from "../../../components/evaluation/ModuleEvaluationContext";
import { segments, sides, movements } from "../auxiliaries/selects";
import {
  getCorporalPart,
  requiresSide,
  formatSegmentLabel,
  formatMovementLabel,
  formatSideLabel,
} from "../auxiliaries/artroHelpers";
import usePlanModuleConfig from "../../../hooks/usePlanModuleConfig";

const segmentOptions = segments.map((item) => ({
  key: item.key,
  value: item.value,
  label: formatSegmentLabel(item.value),
}));

const sideOptions = sides.map((item) => ({
  key: item.key,
  value: item.value,
  label: formatSideLabel(item.value),
}));

const EvaluationSetupScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, currentClient, refreshClients } = useContext(AuthContext);
  const [segment, setSegment] = useState("");
  const [side, setSide] = useState("");
  const [movement, setMovement] = useState("");
  const planConfig = usePlanModuleConfig("artro");

  const sideRequired = requiresSide(segment);
  const corporalPart = getCorporalPart(segment);
  const canStart = segment && movement && (!sideRequired || side);

  const movementOptions = (movements[segment] || []).map((item) => ({
    key: item.key,
    value: item.value,
    label: formatMovementLabel(item.value),
  }));

  useEffect(() => {
    if (user?.id) {
      refreshClients();
    }
  }, [user?.id]);

  useEffect(() => {
    if (!currentClient?.id || !planConfig?.segment) {
      setSegment("");
      setSide("");
      setMovement("");
      return;
    }

    setSegment(planConfig.segment);
    setSide(planConfig.side || "");
    setMovement(planConfig.movement || "");
  }, [
    currentClient?.id,
    planConfig?.segment,
    planConfig?.side,
    planConfig?.movement,
  ]);

  useEffect(() => {
    if (!segment) {
      setSide("");
      setMovement("");
      return;
    }

    const validMovements = (movements[segment] || []).map((item) => item.value);
    if (movement && !validMovements.includes(movement)) {
      setMovement("");
    }

    if (!requiresSide(segment)) {
      setSide("");
    }
  }, [segment]);

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

    navigation.navigate("ArtroEvaluation", {
      segment,
      side,
      movement,
      corporalPart,
    });
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
            <Text style={styles.headerTitle}>EVALUACIÓN</Text>
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
          <ModuleEvaluationContext moduleId="artro" accentColor="#a855f7" />

          <Text style={styles.sectionTitle}>ARTICULACIÓN</Text>
          <View style={styles.formCard}>
            <SelectField
              label="Segmento"
              placeholder="Seleccionar segmento"
              value={segment}
              options={segmentOptions}
              onSelect={setSegment}
            />

            {sideRequired ? (
              <SelectField
                label="Lado"
                placeholder="Seleccionar lado"
                value={side}
                options={sideOptions}
                onSelect={setSide}
              />
            ) : null}

            {segment ? (
              <SelectField
                label="Movimiento"
                placeholder="Seleccionar movimiento"
                value={movement}
                options={movementOptions}
                onSelect={setMovement}
              />
            ) : null}
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
              colors={canStart ? ["#a855f7", "#7e22ce"] : ["#444", "#333"]}
              style={styles.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.buttonText}>INICIAR MEDICIÓN</Text>
              <Ionicons name="play" size={20} color="white" />
            </LinearGradient>
          </TouchableOpacity>

          {!user ? (
            <Text style={styles.hintText}>
              Podés medir sin sesión, pero necesitás iniciar sesión y elegir
              paciente para guardar.
            </Text>
          ) : null}
        </ScrollView>
      </ScreenLayout>
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
  appIcon: { width: 32, height: 32, tintColor: "#a855f7", marginRight: 8 },
  scrollContent: { padding: 24, paddingBottom: 16 },
  sectionTitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 8,
  },
  planHint: {
    color: "rgba(168, 85, 247, 0.85)",
    fontSize: 12,
    marginBottom: 10,
    lineHeight: 18,
  },
  clientCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(44, 44, 44, 0.6)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.3)",
  },
  clientInfo: { flex: 1, marginLeft: 12 },
  clientName: { color: "#a855f7", fontSize: 16, fontWeight: "bold" },
  clientEmail: { color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 4 },
  formCard: {
    backgroundColor: "rgba(44, 44, 44, 0.4)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  summaryCard: {
    backgroundColor: "rgba(168, 85, 247, 0.1)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.3)",
  },
  summaryTitle: {
    color: "#a855f7",
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
  hintText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    textAlign: "center",
    marginTop: 16,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  confirmationCard: {
    backgroundColor: "#2c2c2c",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  confirmationTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  confirmationText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
  },
  confirmationButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  cancelButton: { paddingVertical: 10, paddingHorizontal: 16 },
  cancelButtonText: { color: "rgba(255,255,255,0.6)", fontSize: 14 },
  confirmButton: {
    backgroundColor: "rgba(168, 85, 247, 0.2)",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.4)",
  },
  confirmButtonText: { color: "#a855f7", fontWeight: "600", fontSize: 14 },
});

export default EvaluationSetupScreen;
