import React, { useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Linking,
  Image,
  ScrollView,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { exercises } from "../auxiliaries/objects/exercises";
import { useAuth } from "../../../auth/AuthContext";
import ModuleEvaluationContext from "../../../components/evaluation/ModuleEvaluationContext";
import usePlanModuleConfig from "../../../hooks/usePlanModuleConfig";
import { filterByAllowedNames } from "../../../config/evaluationPlanHelpers";

const { width } = Dimensions.get("window");

const ExerciseSelection = ({ navigation }) => {
  const { refreshClients } = useAuth();
  const planConfig = usePlanModuleConfig("jump");

  const visibleExercises = useMemo(() => {
    if (!planConfig?.allowedTests?.length) return exercises;
    return filterByAllowedNames(exercises, planConfig.allowedTests, "name");
  }, [planConfig]);

  useEffect(() => {
    refreshClients();
  }, [refreshClients]);

  return (
    <LinearGradient colors={["#0f0f0f", "#1a1a1a"]} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerButton}>
          <TouchableOpacity
            onPress={() => navigation.navigate("Home")}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={20} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>HOME</Text>
        </View>

        <Image
          source={require("../../../assets/e_icono.png")}
          style={styles.appIcon}
          resizeMode="contain"
        />
      </View>

      <ScrollView style={styles.mainContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>SELECCIONE SU EJERCICIO</Text>

        <View style={{ zIndex: 1000 }}>
          <ModuleEvaluationContext moduleId="jump" accentColor="#a3e635" compact />
        </View>

        {/* Lista de ejercicios */}
        <View style={styles.exercisesContainer}>
          {visibleExercises.length === 0 ? (
            <Text style={styles.emptyPlanHint}>
              No hay tests habilitados en el plan de este paciente.
            </Text>
          ) : null}
          {visibleExercises.map((exercise) => (
            <View key={exercise.type}>
              <TouchableOpacity
                style={[
                  styles.exerciseCard,
                  { borderLeftColor: exercise.color },
                  planConfig?.defaultTest === exercise.name && styles.exerciseCardSuggested,
                ]}
                onPress={() => {
                  navigation.navigate("JumpExercise", {
                    exercise,
                    defaultLegSide: planConfig?.defaultLegSide || "",
                  });
                }}
                activeOpacity={0.8}
              >
                <View style={styles.exerciseContent}>
                  <Ionicons
                    name={exercise.icon}
                    size={28}
                    color={exercise.color}
                    style={styles.exerciseIcon}
                  />
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color="rgba(255,255,255,0.5)"
                />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Footer */}
      <Animated.View
        entering={FadeIn.delay(600).duration(1000)}
        style={styles.footer}
      >
        <TouchableOpacity
          onPress={() =>
            Linking.openURL(
              "https://www.instagram.com/kinapp.dev?igsh=d21nYnhtaTJpdDJ0"
            )
          }
          activeOpacity={0.7}
        >
          <View style={styles.footerContent}>
            <Text style={styles.footerText}>
              Desarrollado por{" "}
              <Text style={styles.footerHighlight}>BASSINO - VEGA POSE</Text>
            </Text>
            <View style={styles.socialLink}>
              <Ionicons
                name="logo-instagram"
                size={16}
                color="rgba(255, 255, 255, 0.6)"
              />
              <Text style={styles.socialText}>@kinapp.dev</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </LinearGradient>
  );
};

// Los estilos se mantienen igual que en tu código original
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  // header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  headerButton: {
    flexDirection: "row",
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: "Inter-Bold",
    letterSpacing: 1,
  },
  appIcon: {
    width: 44,
    height: 44,
    tintColor: "#00ffff",
    marginRight: 8,
  },
  // header
  mainContent: {
    flex: 1,
  },
  clientSection: {
    marginBottom: 20,
    position: "relative",
  },
  searchInput: {
    zIndex: 1000,
    elevation: 1000,
  },
  backButton: {
    marginRight: 12,
    zIndex: 1,
  },

  title: {
    color: "#ffffff",
    fontSize: 24,
    fontFamily: "Inter-Bold",
    textAlign: "center",
    letterSpacing: 1.5,
    marginBottom: 8,
    marginTop: 5,
    textTransform: "uppercase",
  },
  subtitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    fontFamily: "Inter-Medium",
    textAlign: "center",
    letterSpacing: 0.5,
    marginBottom: 40,
  },
  clientBadge: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#2c2c2c",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(0, 255, 255, 0.2)",
  },
  clientInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  clientName: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: "Inter-Medium",
    marginLeft: 10,
  },
  removeButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
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
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  confirmationTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontFamily: "Inter-Bold",
    marginBottom: 12,
    textAlign: "center",
  },
  confirmationText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 16,
    fontFamily: "Inter-Regular",
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 24,
  },
  confirmationButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    alignItems: "center",
    marginRight: 8,
  },
  cancelButtonText: {
    color: "#ffffff",
    fontFamily: "Inter-Medium",
  },
  confirmButton: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  buttonGradient: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#ffffff",
    fontFamily: "Inter-Medium",
    marginRight: 8,
  },
  exercisesContainer: {
    marginTop: 20,
  },
  emptyPlanHint: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 24,
    lineHeight: 20,
  },
  exerciseCard: {
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
  exerciseCardSuggested: {
    borderWidth: 1,
    borderColor: "rgba(0, 255, 255, 0.35)",
    backgroundColor: "rgba(0, 255, 255, 0.06)",
  },
  exerciseContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  exerciseIcon: {
    marginRight: 16,
  },
  exerciseName: {
    color: "#ffffff",
    fontSize: 18,
    fontFamily: "Inter-Medium",
  },
  footer: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 20,
  },
  footerContent: {
    alignItems: "center",
  },
  footerText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
    fontFamily: "Inter-Light",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  footerHighlight: {
    color: "#00ffff",
    fontFamily: "Inter-Medium",
  },
  socialLink: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  socialText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 13,
    fontFamily: "Inter-Light",
    marginLeft: 6,
    letterSpacing: 0.3,
  },
});

export default ExerciseSelection;
