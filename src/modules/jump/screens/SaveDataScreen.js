import React, { useState, useContext, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../../../auth/AuthContext";
import ClientSearchInput from "../../../components/search/ClientSearchInput";
import { createMotion } from "../../../services/motion";

const { width, height } = Dimensions.get("window");

const SaveDataScreen = ({ navigation, route }) => {
  const { user, userClients, currentClient, selectClient, refreshClients } =
    useContext(AuthContext);
  const { exercise, currentData, bodyWeight, side, jumpMetrics } = route.params;

  useEffect(() => {
    refreshClients();
  }, []);

  const [sessionName, setSessionName] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const motionData = {
    email: currentClient?.email,
    motionType: "jump",
    accData: currentData,
    weight: bodyWeight,
    side,
    dataObj: {
      exercise: exercise.name,
      jumpMetrics,
      notes,
    },
    clientId: currentClient?._id,
    userId: user.id,
  };

  const handleSubmit = useCallback(async () => {
    if (!currentClient) {
      setSubmitError("Por favor selecciona un cliente");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await createMotion(motionData);
      setSubmitSuccess(true);
      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
        navigation.navigate("JumpExerciseSelection");
      }, 2000);
    } catch (error) {
      console.error("Error saving motion data:", error);
      setSubmitError(error.message || "Error al guardar la sesión");
    } finally {
      setIsSubmitting(false);
    }
  }, [motionData, currentClient]);

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

      <Animated.View
        entering={FadeInUp.delay(200).duration(600)}
        style={styles.contentContainer}
      >
        <Animated.View
          entering={FadeInUp.delay(400).duration(600)}
          style={styles.formContainer}
        >
          {!currentClient && (
            <ClientSearchInput
              userClients={userClients}
              onSelectClient={(client) => {
                selectClient(client);
                setSubmitError(null);
              }}
              accentColor="#00ffff"
            />
          )}

          {/* Sección del cliente con estilos mejorados */}
          {currentClient && (
            <View style={styles.clientInfoContainer}>
              <LinearGradient
                colors={["rgba(0, 255, 255, 0.1)", "rgba(0, 255, 255, 0.05)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.clientGradient}
              >
                <View style={styles.clientHeader}>
                  <Ionicons name="person-circle" size={24} color="#00ffff" />
                  <Text style={styles.clientGuardando}>
                    Guardando evaluación para:
                  </Text>
                </View>

                <Text style={styles.clientName}>
                  {currentClient.firstName} {currentClient.lastName}
                </Text>

                <View style={styles.clientDetails}>
                  <Ionicons
                    name="mail"
                    size={16}
                    color="rgba(255,255,255,0.7)"
                  />
                  <Text style={styles.clientEmail}>{currentClient.email}</Text>
                </View>
              </LinearGradient>
            </View>
          )}

          <Text style={styles.inputLabel}>NOTAS</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            multiline
            placeholder="Añade observaciones importantes..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={notes}
            onChangeText={setNotes}
          />

          {/* Mensajes de estado */}
          {submitError && (
            <View style={styles.errorContainer}>
              <Ionicons name="warning-outline" size={20} color="#ff5555" />
              <Text style={styles.errorText}>{submitError}</Text>
            </View>
          )}

          {isSubmitting && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#00ffff" />
              <Text style={styles.loadingText}>Guardando datos...</Text>
            </View>
          )}
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(600).duration(600)}
          style={styles.buttonContainer}
        >
          <TouchableOpacity
            style={[styles.saveButton, isSubmitting && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <LinearGradient
              colors={["#00b4d8", "#00ffff"]}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text style={styles.buttonText}>GUARDAR SESIÓN</Text>
                  <Ionicons name="save-outline" size={20} color="white" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

      {/* Modal de éxito */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showSuccessModal}
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={["#1a1a1a", "#2c2c2c"]}
              style={styles.modalContent}
            >
              <View style={styles.successIconContainer}>
                <Ionicons name="checkmark-done" size={48} color="#4BB543" />
              </View>
              <Text style={styles.modalTitle}>¡Guardado exitoso!</Text>
              <Text style={styles.modalText}>
                Los datos de la sesión se han guardado correctamente para el
                paciente.
              </Text>
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
  },
  // header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 40,
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
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  formContainer: {
    marginBottom: 24,
  },
  clientInfoContainer: {
    marginBottom: 24,
    borderRadius: 12,
    overflow: "hidden",
  },
  clientGradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(0, 255, 255, 0.2)",
    borderRadius: 12,
  },
  clientHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  clientName: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  clientGuardando: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  clientDetails: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  clientEmail: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontWeight: "normal",
    marginLeft: 8,
  },
  inputLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 16,
    color: "#ffffff",
    fontWeight: "500",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  buttonContainer: {
    marginBottom: 30,
  },
  saveButton: {
    borderRadius: 14,
    overflow: "hidden",
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonGradient: {
    paddingVertical: 16,
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
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 85, 85, 0.1)",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 85, 85, 0.3)",
  },
  errorText: {
    color: "#ff5555",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    marginBottom: 16,
  },
  loadingText: {
    color: "#00ffff",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
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
  successIconContainer: {
    backgroundColor: "rgba(75, 181, 67, 0.1)",
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "rgba(75, 181, 67, 0.3)",
  },
  modalTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  modalText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
});

export default SaveDataScreen;
