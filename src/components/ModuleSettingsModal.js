import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Switch,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCommandSettings } from "../context/CommandSettingsContext";
import { MODULES } from "../config/modules";

const ModuleSettingsModal = ({
  visible,
  onClose,
  enabledIds,
  onToggleModule,
  hasActivePatient = false,
  hasActivePlan = false,
}) => {
  const {
    voiceEnabled,
    toggleVoice,
    visualAlwaysEnabled,
  } = useCommandSettings();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Ajustes de Kinecat</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Comandos de evaluación</Text>
            <View style={styles.row}>
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>Voz</Text>
                <Text style={styles.rowHint}>Instrucciones habladas</Text>
              </View>
              <Switch
                value={voiceEnabled}
                onValueChange={toggleVoice}
                trackColor={{ false: "#444", true: "#00ffff88" }}
                thumbColor={voiceEnabled ? "#00ffff" : "#ccc"}
              />
            </View>
            <View style={styles.row}>
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>Visual</Text>
                <Text style={styles.rowHint}>
                  {visualAlwaysEnabled
                    ? "Siempre activo (útil sin voz)"
                    : "Desactivado"}
                </Text>
              </View>
              <Switch value={visualAlwaysEnabled} disabled />
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 18 }]}>
              Módulos en este dispositivo
            </Text>
            <Text style={styles.sectionHint}>
              Define qué herramientas ves en Kinecat en este teléfono.{" "}
              {hasActivePatient && hasActivePlan
                ? "Con un paciente y plan activo, solo se muestran los módulos que coinciden con ambos."
                : hasActivePatient
                  ? "Con paciente sin plan web, se respetan solo estos ajustes."
                  : "Sin paciente seleccionado, se usan solo estos ajustes (modo libre)."}
            </Text>
            <Text style={styles.sectionHintSecondary}>
              El preset clínico (segmento, test, ejercicio) se configura en KinApp web → Plan KinApp por paciente.
            </Text>
            {MODULES.filter((module) => module.available).map((module) => {
              const isOn = enabledIds.includes(module.id);
              return (
                <View key={module.id} style={styles.row}>
                  <View style={styles.rowText}>
                    <Text style={styles.rowLabel}>{module.title}</Text>
                    <Text style={styles.rowHint}>{module.subtitle}</Text>
                  </View>
                  <Switch
                    value={isOn}
                    onValueChange={() => onToggleModule(module.id)}
                    trackColor={{ false: "#444", true: `${module.accent}88` }}
                    thumbColor={isOn ? module.accent : "#ccc"}
                  />
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    backgroundColor: "#151515",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
    maxHeight: "82%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  sectionTitle: {
    color: "#00ffff",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  sectionHint: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 8,
  },
  sectionHintSecondary: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 12,
    fontStyle: "italic",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
    gap: 12,
  },
  rowText: { flex: 1 },
  rowLabel: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  rowHint: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    marginTop: 2,
  },
});

export default ModuleSettingsModal;
