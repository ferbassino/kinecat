import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  Image,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
// import {
//   useFonts,
//   Inter_700Bold,
//   Inter_600SemiBold,
//   Inter_400Regular,
// } from "@expo-google-fonts/inter";

import MainHeader from "../components/headers/MainHeader";
import ExerciseHeader from "../components/headers/ExerciseHeader";
import ActionButton from "../components/buttons/ActionButton";
import { exerciseData } from "../auxiliaries/objects/exerciseData";
import GlobalMetrics from "../components/resultados/GlobalMetrics";
import CVChart from "../components/resultados/CVChart";
import PermEnChart from "../components/resultados/PermEnChart";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../auth/AuthContext";

const ResultsScreen = ({ route, navigation }) => {
  const {
    cv,
    ventanas,
    permutationEn,
    regularity,
    rms,
    isBaseline,
    interpretation,
    exercise,
    currentData,
    pitch,
    roll,
    bodySide = "none",
    analysisVersion,
    cvTrend = null,
    permEnTrend = null,
  } = route.params;
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);

  const currentExercise = exerciseData[exercise.type];
  const requiresBodySide = ["Apoyo Monopodal", "Puente Lateral"].includes(
    exercise.name
  );

  return (
    <LinearGradient colors={["#0f0f0f", "#1a1a1a"]} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerButton}>
          <TouchableOpacity
            onPress={() => navigation.navigate("ExerciseSelection")}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={20} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>SELECCIONAR</Text>
        </View>

        <Image
          source={require("../assets/e_icono.png")}
          style={styles.appIcon}
          resizeMode="contain"
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <ExerciseHeader exercise={exercise} exerciseData={exerciseData} />

        {requiresBodySide && bodySide && (
          <View style={styles.bodySideInfoContainer}>
            <Ionicons
              name={bodySide === "left" ? "body-outline" : "body"}
              size={20}
              color="#00b4d8"
              style={{
                transform: [{ scaleX: bodySide === "left" ? 1 : -1 }],
              }}
            />
            <Text style={styles.bodySideText}>
              {bodySide === "left" ? "LADO IZQUIERDO" : "LADO DERECHO"}
            </Text>
          </View>
        )}

        <GlobalMetrics
          cv={cv}
          permutationEn={permutationEn}
          regularity={regularity}
          rms={rms}
          isBaseline={isBaseline}
          interpretation={interpretation}
          trendValue={cvTrend}
          permEnTrendValue={permEnTrend}
          accentColor={currentExercise.color}
        />

        <CVChart ventanas={ventanas} accentColor={currentExercise.color} />

        <PermEnChart ventanas={ventanas} accentColor="#c084fc" />

        <View style={styles.buttonContainer}>
          <ActionButton
            onPress={() => {
              if (!user) {
                setShowModal(true);
                return;
              }

              navigation.navigate("SaveData", {
                exercise,
                cv,
                permutationEn,
                regularity,
                rms,
                isBaseline,
                cvTrend,
                permEnTrend,
                analysisVersion,
                currentData,
                ventanas,
                pitch,
                roll,
                bodySide,
              });
            }}
            text="GUARDAR EVALUACIÓN"
            iconName="save-outline"
            colors={["#2196F3", "#4CAF50"]}
          />
        </View>
        <View style={styles.buttonContainer}>
          <ActionButton
            onPress={() => navigation.navigate("ExerciseSelection")}
            text="VOLVER A SELECCIONAR"
            iconName="ellipsis-vertical-circle-outline"
            colors={["#a855f7", "#7e22ce"]}
          />
        </View>
        <View style={styles.marginBottom}></View>
      </ScrollView>
      {/* Modal para usuarios no registrados */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showModal}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={["#2c2c2c", "#1a1a1a"]}
              style={styles.modalContent}
            >
              <Ionicons
                name="lock-closed"
                size={40}
                color="#FF5555"
                style={styles.modalIcon}
              />
              <Text style={styles.modalTitle}>Función no disponible</Text>
              <Text style={styles.modalText}>
                La opción de guardar datos de pacientes solo está disponible
                para usuarios registrados.
              </Text>

              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.modalButtonText}>Entendido</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,

    paddingTop: 40,
    paddingBottom: 40,
  },
  scrollContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  buttonContainer: {
    marginTop: 10,
  },
  marginBottom: {
    marginBottom: 40,
  },
  saveButton: {
    borderRadius: 14,
    overflow: "hidden",
  },
  buttonGradient: {
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  bodySideInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "rgba(0, 180, 216, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(0, 180, 216, 0.3)",
  },
  bodySideText: {
    color: "#00b4d8",
    fontSize: 14,
    // fontFamily: "Inter-SemiBold",
    fontWeight: "600",
    letterSpacing: 0.5,
    marginLeft: 8,
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
    // fontFamily: "Inter-Bold",
    fontWeight: "bold",
    letterSpacing: 1,
  },
  appIcon: {
    width: 32,
    height: 32,
    tintColor: "#00ffff",
    marginRight: 8,
  },
  // header
  backButton: {
    marginRight: 12,
    zIndex: 1,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 16,
    // fontFamily: "Inter-Bold",
    fontWeight: "bold",
    letterSpacing: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "80%",
    borderRadius: 16,
    overflow: "hidden",
  },
  modalContent: {
    padding: 24,
    alignItems: "center",
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    // fontFamily: "Inter-Bold",
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  modalText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    // fontFamily: "Inter-Medium",
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButton: {
    backgroundColor: "rgba(255, 85, 85, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(255, 85, 85, 0.5)",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  modalButtonText: {
    color: "#FF5555",
    // fontFamily: "Inter-Bold",
    fontWeight: "bold",
    fontSize: 14,
  },
});

export default ResultsScreen;
