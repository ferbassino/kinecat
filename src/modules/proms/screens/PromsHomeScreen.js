import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenLayout from "../../../components/ScreenLayout";
import { PROM_CATALOG } from "../data/promCatalog";
import ModuleEvaluationContext from "../../../components/evaluation/ModuleEvaluationContext";
import usePlanModuleConfig from "../../../hooks/usePlanModuleConfig";
import { filterByAllowedIds } from "../../../config/evaluationPlanHelpers";

const PromsHomeScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const planConfig = usePlanModuleConfig("proms");

  const visibleProms = useMemo(() => {
    if (!planConfig?.allowedPromIds?.length) return PROM_CATALOG;
    return filterByAllowedIds(PROM_CATALOG, planConfig.allowedPromIds, "id");
  }, [planConfig]);

  const openProm = (prom) => {
    Alert.alert(
      prom.title,
      "Los cuestionarios se descargarán desde KinApp en la próxima versión. Por ahora podés ver el catálogo disponible.",
      [{ text: "Entendido" }],
    );
  };

  return (
    <LinearGradient colors={["#0f0f0f", "#1a1a1a"]} style={styles.container}>
      <ScreenLayout bottomInset>
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity
            onPress={() => navigation.navigate("Home")}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={20} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>PROMs</Text>
          <Ionicons name="clipboard-outline" size={22} color="#ec4899" />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <ModuleEvaluationContext moduleId="proms" accentColor="#ec4899" compact />

          <Text style={styles.subtitle}>
            Cuestionarios clínicos estandarizados. Se sincronizarán con la web
            cuando el esquema versionado esté activo en KinApp.
          </Text>

          {visibleProms.length === 0 ? (
            <Text style={styles.emptyPlanHint}>
              No hay cuestionarios habilitados en el plan de este paciente.
            </Text>
          ) : null}

          {visibleProms.map((prom) => (
            <TouchableOpacity
              key={prom.id}
              activeOpacity={0.85}
              onPress={() => openProm(prom)}
              style={[
                styles.card,
                { borderColor: `${prom.accent}44` },
                planConfig?.defaultPromId === prom.id && styles.cardSuggested,
              ]}
            >
              <View style={[styles.iconWrap, { backgroundColor: `${prom.accent}22` }]}>
                <Ionicons name="document-text-outline" size={22} color={prom.accent} />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{prom.title}</Text>
                <Text style={styles.cardSubtitle}>{prom.subtitle}</Text>
                <Text style={[styles.cardMeta, { color: prom.accent }]}>
                  {prom.questions} ítems
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={prom.accent} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ScreenLayout>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  subtitle: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 18,
  },
  emptyPlanHint: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 24,
    lineHeight: 20,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: "rgba(26,26,26,0.95)",
    marginBottom: 12,
    gap: 12,
  },
  cardSuggested: {
    borderWidth: 2,
    backgroundColor: "rgba(236, 72, 153, 0.08)",
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: { flex: 1 },
  cardTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  cardSubtitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    marginTop: 2,
  },
  cardMeta: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 6,
  },
});

export default PromsHomeScreen;
