import React, { useContext, useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
  Image,
  Linking,
  Animated,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuthContext } from "../auth/AuthContext";
import ModuleCard from "../components/ModuleCard";
import ModuleSettingsModal from "../components/ModuleSettingsModal";
import EvaluationSessionCard from "../components/evaluation/EvaluationSessionCard";
import { useAccessibleModules } from "../hooks/useAccessibleModules";
import useEvaluationSession from "../hooks/useEvaluationSession";
import { formatModuleConfigSummary } from "../constants/evaluationPlanModuleOptions";
import { colors } from "../config/theme";

const { width } = Dimensions.get("window");

const HomeScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, logout } = useContext(AuthContext);
  const { mode, isPlanActive, evaluationPlan, currentClient, planEnabledModuleIds } =
    useEvaluationSession();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(40));
  const [settingsVisible, setSettingsVisible] = useState(false);

  const {
    loaded,
    activeModules,
    planLockedModules,
    enabledIds,
    toggleModule,
  } = useAccessibleModules(currentClient ? planEnabledModuleIds : null);

  const modulePlanSummaries = useMemo(() => {
    if (!evaluationPlan?.modules) return {};
    return evaluationPlan.modules.reduce((acc, entry) => {
      if (entry.enabled) {
        acc[entry.moduleId] = formatModuleConfigSummary(
          entry.moduleId,
          entry.config,
        );
      }
      return acc;
    }, {});
  }, [evaluationPlan]);

  const footerHint = useMemo(() => {
    if (!loaded) return "";
    if (mode === "planned") {
      return `${activeModules.length} módulo(s) disponibles según plan + este dispositivo`;
    }
    if (planLockedModules.length) {
      return `${planLockedModules.length} módulo(s) ocultos por el plan del paciente`;
    }
    return `${activeModules.length} módulo(s) según ajustes de este teléfono`;
  }, [loaded, mode, activeModules.length, planLockedModules.length]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        delay: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleModulePress = (module) => {
    if (module.route) {
      navigation.navigate(module.route);
    }
  };

  return (
    <ImageBackground
      source={require("../assets/background.jpg")}
      style={styles.background}
      blurRadius={2}
    >
      <LinearGradient colors={colors.overlay} style={styles.overlay}>
        <View
          style={[
            styles.container,
            { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 },
          ]}
        >
          <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
            <Image
              source={require("../assets/e_icono.png")}
              style={styles.appIcon}
              resizeMode="contain"
            />
            <View style={styles.appNameContainer}>
              <Text style={styles.appName}>KINECAT</Text>
              <Text style={styles.appTagline}>Evaluación clínica móvil</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.settingsButton}
                onPress={() => setSettingsVisible(true)}
              >
                <Ionicons name="options-outline" size={18} color={colors.cyan} />
              </TouchableOpacity>
              {user ? (
                <TouchableOpacity style={styles.userBadge} onPress={logout}>
                  <Text style={styles.userText} numberOfLines={1} ellipsizeMode="tail">
                    {user.email.split("@")[0]}
                  </Text>
                  <Ionicons name="log-out" size={18} color={colors.pink} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.loginChip}
                  onPress={() => navigation.navigate("Login")}
                >
                  <Ionicons name="log-in-outline" size={16} color={colors.cyan} />
                  <Text style={styles.loginChipText}>Entrar</Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>

          <Animated.View
            style={[
              styles.hero,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <EvaluationSessionCard accentColor={colors.cyan} />
          </Animated.View>

          <Animated.View
            style={[
              styles.modulesSection,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <Text style={styles.modulesHeading}>Herramientas</Text>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modulesScroll}
            >
              {loaded &&
                activeModules.map((module) => (
                  <ModuleCard
                    key={module.id}
                    module={module}
                    onPress={() => handleModulePress(module)}
                    statusLabel={
                      isPlanActive && modulePlanSummaries[module.id]
                        ? "Plan"
                        : undefined
                    }
                    subtitleOverride={
                      isPlanActive && modulePlanSummaries[module.id]
                        ? modulePlanSummaries[module.id]
                        : undefined
                    }
                  />
                ))}

              {loaded && planLockedModules.length > 0 ? (
                <>
                  <Text style={styles.lockedHeading}>
                    No incluidos en el plan de este paciente
                  </Text>
                  {planLockedModules.map((module) => (
                    <ModuleCard
                      key={`locked-${module.id}`}
                      module={module}
                      disabled
                      subtitleOverride="Activo en este teléfono, pero no indicado en el plan KinApp web."
                    />
                  ))}
                </>
              ) : null}
            </ScrollView>
          </Animated.View>

          <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
            <Text style={styles.footerHint}>{footerHint}</Text>
            <TouchableOpacity onPress={openInstagram} activeOpacity={0.7}>
              <View style={styles.footerContent}>
                <Text style={styles.footerText}>
                  Desarrollado por{" "}
                  <Text style={styles.footerHighlight}>FERNANDO BASSINO</Text>
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </LinearGradient>

      <ModuleSettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        enabledIds={enabledIds}
        onToggleModule={toggleModule}
        hasActivePatient={Boolean(currentClient)}
        hasActivePlan={isPlanActive}
      />
    </ImageBackground>
  );

  async function openInstagram() {
    const username = "ferbassino.dev";
    const instagramApp = `instagram://user?username=${username}`;
    const instagramWeb = `https://www.instagram.com/${username}`;
    try {
      const supported = await Linking.canOpenURL(instagramApp);
      await Linking.openURL(supported ? instagramApp : instagramWeb);
    } catch {
      await Linking.openURL(instagramWeb);
    }
  }
};

const styles = StyleSheet.create({
  background: { flex: 1, width: "100%", height: "100%" },
  overlay: { flex: 1, paddingHorizontal: 20 },
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  appIcon: {
    width: 42,
    height: 42,
    tintColor: colors.cyan,
  },
  appNameContainer: {
    flex: 1,
    marginLeft: 12,
  },
  appName: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 3,
  },
  appTagline: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
    letterSpacing: 0.3,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  settingsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(0,255,255,0.2)",
  },
  userBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    maxWidth: width * 0.28,
    gap: 6,
  },
  userText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "500",
    flexShrink: 1,
  },
  loginChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(0, 255, 255, 0.25)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  loginChipText: {
    color: colors.cyan,
    fontSize: 13,
    fontWeight: "600",
  },
  hero: {
    marginBottom: 8,
  },
  modulesSection: {
    flex: 1,
  },
  modulesHeading: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  lockedHeading: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  modulesScroll: {
    paddingBottom: 8,
  },
  footer: {
    alignItems: "center",
    paddingTop: 8,
  },
  footerHint: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 11,
    marginBottom: 8,
    letterSpacing: 0.3,
    textAlign: "center",
  },
  footerContent: { alignItems: "center" },
  footerText: {
    color: colors.textSubtle,
    fontSize: 13,
    fontWeight: "300",
  },
  footerHighlight: {
    color: colors.cyan,
    fontWeight: "500",
  },
});

export default HomeScreen;
