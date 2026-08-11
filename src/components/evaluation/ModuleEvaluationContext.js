import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ClientSearchInput from "../search/ClientSearchInput";
import useEvaluationSession from "../../hooks/useEvaluationSession";
import usePlanModuleConfig from "../../hooks/usePlanModuleConfig";
import {
  formatModuleConfigSummary,
  hasMeaningfulModuleConfig,
} from "../../constants/evaluationPlanModuleOptions";

/**
 * Cabecera unificada dentro de cada módulo: paciente + estado plan/preset.
 */
const ModuleEvaluationContext = ({
  moduleId,
  accentColor = "#00ffff",
  compact = false,
}) => {
  const {
    user,
    currentClient,
    userClients,
    selectClient,
    clearPatient,
    refreshClients,
    mode,
    sessionCopy,
  } = useEvaluationSession();
  const planConfig = usePlanModuleConfig(moduleId);
  const [confirmClear, setConfirmClear] = useState(false);

  const presetSummary = planConfig
    ? formatModuleConfigSummary(moduleId, planConfig)
    : "";
  const hasPreset =
    mode === "planned" &&
    planConfig &&
    hasMeaningfulModuleConfig(moduleId, planConfig);

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionLabel}>PACIENTE Y CONTEXTO</Text>

      {user && currentClient ? (
        <View style={[styles.patientCard, { borderColor: `${accentColor}40` }]}>
          <Ionicons name="person" size={20} color={accentColor} />
          <View style={styles.patientBody}>
            <Text style={[styles.patientName, { color: accentColor }]}>
              {currentClient.name} {currentClient.surname}
            </Text>
            <Text style={styles.patientMeta}>
              {mode === "planned" ? sessionCopy.badge : sessionCopy.title}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setConfirmClear(true)}>
            <Ionicons name="close-circle" size={22} color="rgba(255,255,255,0.45)" />
          </TouchableOpacity>
        </View>
      ) : user ? (
        <ClientSearchInput
          userClients={userClients}
          onSelectClient={(client) => {
            selectClient(client);
            refreshClients();
          }}
          accentColor={accentColor}
        />
      ) : (
        <View style={styles.guestBox}>
          <Ionicons name="information-circle-outline" size={18} color={accentColor} />
          <Text style={styles.guestText}>
            Sin sesión: medís en modo libre. Iniciá sesión para vincular al paciente y al plan KinApp.
          </Text>
        </View>
      )}

      <View
        style={[
          styles.contextBanner,
          hasPreset ? styles.contextBannerPlan : styles.contextBannerManual,
          { borderColor: hasPreset ? `${accentColor}44` : "rgba(255,255,255,0.1)" },
        ]}
      >
        <Ionicons
          name={hasPreset ? "sparkles-outline" : "hand-left-outline"}
          size={18}
          color={hasPreset ? accentColor : "rgba(255,255,255,0.55)"}
        />
        <View style={styles.contextBody}>
          <Text
            style={[
              styles.contextTitle,
              { color: hasPreset ? accentColor : "rgba(255,255,255,0.75)" },
            ]}
          >
            {hasPreset ? "Preset del plan KinApp" : "Configuración manual"}
          </Text>
          <Text style={styles.contextSubtitle}>
            {hasPreset
              ? `${presetSummary}. Podés modificarlo abajo antes de medir.`
              : mode === "planned" && !hasPreset
                ? "El plan no define preset para este módulo. Elegí las opciones manualmente."
                : mode === "patient_no_plan"
                  ? "Este paciente no tiene plan web. Elegí todo manualmente."
                  : mode === "free"
                    ? "Elegí paciente arriba para cargar su plan, o continuá en modo libre."
                    : "Elegí las opciones de evaluación manualmente."}
          </Text>
        </View>
      </View>

      {!compact && user && !currentClient ? (
        <Text style={styles.footerHint}>
          Tip: seleccionar paciente aquí aplica el mismo plan que configurás en KinApp web.
        </Text>
      ) : null}

      <Modal visible={confirmClear} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>¿Quitar paciente?</Text>
            <Text style={styles.modalText}>
              Este módulo pasará a modo manual hasta que elijas otro paciente.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setConfirmClear(false)}>
                <Text style={styles.modalCancel}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  clearPatient();
                  setConfirmClear(false);
                }}
              >
                <Text style={[styles.modalConfirm, { color: accentColor }]}>
                  Quitar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  sectionLabel: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 10,
  },
  patientCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.03)",
    marginBottom: 12,
  },
  patientBody: { flex: 1 },
  patientName: { fontSize: 15, fontWeight: "700" },
  patientMeta: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  guestBox: {
    flexDirection: "row",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    marginBottom: 12,
    alignItems: "flex-start",
  },
  guestText: {
    flex: 1,
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    lineHeight: 18,
  },
  contextBanner: {
    flexDirection: "row",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  contextBannerPlan: {
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  contextBannerManual: {
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  contextBody: { flex: 1 },
  contextTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 3,
  },
  contextSubtitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    lineHeight: 17,
  },
  footerHint: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    marginTop: 8,
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: "#2c2c2c",
    borderRadius: 14,
    padding: 18,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  modalText: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 16,
  },
  modalCancel: { color: "rgba(255,255,255,0.5)", fontSize: 14 },
  modalConfirm: { fontWeight: "700", fontSize: 14 },
});

export default ModuleEvaluationContext;
