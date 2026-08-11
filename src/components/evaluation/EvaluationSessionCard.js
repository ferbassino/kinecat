import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ClientSearchInput from "../search/ClientSearchInput";
import useEvaluationSession from "../../hooks/useEvaluationSession";
import { colors } from "../../config/theme";

const EvaluationSessionCard = ({ accentColor = colors.cyan }) => {
  const {
    mode,
    user,
    currentClient,
    userClients,
    selectClient,
    clearPatient,
    refreshClients,
    sessionCopy,
  } = useEvaluationSession();
  const [confirmClear, setConfirmClear] = useState(false);

  const showTitle = mode !== "free" && mode !== "planned" && mode !== "patient_no_plan";
  const showSubtitle =
    showTitle && mode !== "loading" && Boolean(sessionCopy.subtitle);

  return (
    <View style={[styles.card, { borderColor: `${sessionCopy.badgeColor}44` }]}>
      <View style={styles.topRow}>
        <View
          style={[
            styles.badge,
            { backgroundColor: `${sessionCopy.badgeColor}18` },
          ]}
        >
          {mode === "loading" ? (
            <ActivityIndicator size="small" color={sessionCopy.badgeColor} />
          ) : (
            <Ionicons
              name={
                mode === "planned"
                  ? "document-text-outline"
                  : mode === "guest"
                    ? "person-outline"
                    : "options-outline"
              }
              size={14}
              color={sessionCopy.badgeColor}
            />
          )}
          <Text style={[styles.badgeText, { color: sessionCopy.badgeColor }]}>
            {sessionCopy.badge}
          </Text>
        </View>
        {currentClient ? (
          <TouchableOpacity
            onPress={() => setConfirmClear(true)}
            style={styles.changeButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.changeButtonText}>Cambiar</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {showTitle ? <Text style={styles.title}>{sessionCopy.title}</Text> : null}
      {showSubtitle ? (
        <Text style={styles.subtitle}>{sessionCopy.subtitle}</Text>
      ) : null}

      {user && !currentClient ? (
        <View style={[styles.searchWrap, { marginTop: showTitle || showSubtitle ? 8 : 0 }]}>
          <ClientSearchInput
            userClients={userClients}
            onSelectClient={(client) => {
              selectClient(client);
              refreshClients();
            }}
            accentColor={accentColor}
          />
        </View>
      ) : null}

      {currentClient ? (
        <View
          style={[
            styles.patientRow,
            { borderColor: `${accentColor}33`, marginTop: showTitle || showSubtitle ? 8 : 0 },
          ]}
        >
          <Ionicons name="person-circle" size={28} color={accentColor} />
          <View style={styles.patientInfo}>
            <Text style={[styles.patientName, { color: accentColor }]}>
              {currentClient.name} {currentClient.surname}
            </Text>
            <Text style={styles.patientEmail} numberOfLines={1}>
              {currentClient.email || "Paciente activo en esta sesión"}
            </Text>
          </View>
        </View>
      ) : null}

      {!user ? (
        <View style={styles.hintRow}>
          <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
          <Text style={styles.hintText}>
            Los ajustes de módulos (ícono arriba) son de este teléfono. El plan clínico se define en KinApp web.
          </Text>
        </View>
      ) : null}

      <Modal
        visible={confirmClear}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmClear(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>¿Quitar paciente?</Text>
            <Text style={styles.modalText}>
              Volvés a modo libre. Los módulos visibles serán solo los de este dispositivo.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setConfirmClear(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirm}
                onPress={() => {
                  clearPatient();
                  setConfirmClear(false);
                }}
              >
                <Text style={styles.modalConfirmText}>Quitar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginTop: 4,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(20, 20, 20, 0.85)",
    borderWidth: 1,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  changeButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  changeButtonText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  searchWrap: {
    marginTop: 8,
    marginBottom: -4,
  },
  patientRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.03)",
    gap: 10,
  },
  patientInfo: { flex: 1 },
  patientName: {
    fontSize: 15,
    fontWeight: "700",
  },
  patientEmail: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  hintText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: "#2c2c2c",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  modalTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 8,
  },
  modalText: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  modalCancel: { paddingVertical: 8, paddingHorizontal: 12 },
  modalCancelText: { color: "rgba(255,255,255,0.55)", fontSize: 14 },
  modalConfirm: {
    backgroundColor: "rgba(0,255,255,0.12)",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(0,255,255,0.3)",
  },
  modalConfirmText: { color: colors.cyan, fontWeight: "600", fontSize: 14 },
});

export default EvaluationSessionCard;
