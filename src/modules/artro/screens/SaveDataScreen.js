import React, { useState, useContext, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  Modal,
  Animated,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuthContext } from "../../../auth/AuthContext";
import ScreenLayout from "../../../components/ScreenLayout";
import ClientSearchInput from "../../../components/search/ClientSearchInput";
import { createMotion } from "../../../services/motion";
import { buildArtroMotionPayload } from "../utils/prepareArtroPayload";
import {
  formatMovementLabel,
  formatSegmentLabel,
  formatSideLabel,
} from "../auxiliaries/artroHelpers";

const SaveDataScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { user, userClients, currentClient, selectClient } =
    useContext(AuthContext);
  const {
    segment,
    side,
    movement,
    corporalPart,
    gyroData,
    testTimeInput,
    xAngle,
    yAngle,
    zAngle,
  } = route.params;

  const [slideUpAnim] = useState(new Animated.Value(30));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const savedRef = useRef(false);

  const clientDisplayName = currentClient
    ? `${currentClient.name || ""} ${currentClient.surname || ""}`.trim()
    : "";

  const summaryMetrics = [
    { key: "x", label: "Ángulo X", value: `${xAngle.toFixed(1)}°` },
    { key: "y", label: "Ángulo Y", value: `${yAngle.toFixed(1)}°` },
    { key: "z", label: "Ángulo Z", value: `${zAngle.toFixed(1)}°` },
    { key: "rom", label: "ROM X", value: `${xAngle.toFixed(1)}°` },
  ];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleCloseSuccess = () => {
    setShowStatusModal(false);
    navigation.replace("ArtroEvaluationSetup");
  };

  const handleSubmit = useCallback(async () => {
    if (savedRef.current || isSaved) return;

    if (!user?.id) {
      setSubmitError("Tenés que iniciar sesión para guardar la evaluación");
      return;
    }

    if (!currentClient) {
      setSubmitError("Por favor seleccioná un paciente");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const motionData = buildArtroMotionPayload({
      currentClient,
      user,
      segment,
      side,
      movement,
      corporalPart,
      gyroData,
      testTime: testTimeInput,
      xAngle,
      yAngle,
      zAngle,
      notes,
    });

    try {
      await createMotion(motionData);
      savedRef.current = true;
      setIsSaved(true);
      setShowStatusModal(true);
    } catch (error) {
      console.error("Error saving motion data:", error);
      setSubmitError(error.message || "Error al guardar la evaluación");
      setShowStatusModal(true);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    user,
    currentClient,
    segment,
    side,
    movement,
    corporalPart,
    gyroData,
    testTimeInput,
    xAngle,
    yAngle,
    zAngle,
    notes,
    isSaved,
  ]);

  const evalTitle = `${formatSegmentLabel(segment)} · ${formatMovementLabel(movement)}${
    side ? ` · ${formatSideLabel(side)}` : ""
  }`;

  return (
    <LinearGradient colors={["#0f0f0f", "#1a1a1a"]} style={styles.container}>
      <ScreenLayout bottomInset>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerButton}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            disabled={isSubmitting}
          >
            <Ionicons name="chevron-back" size={20} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>GUARDAR</Text>
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
        <Animated.View
          style={[
            styles.contentContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={["#2c2c2c", "#1a1a1a"]}
            style={styles.summaryCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.exerciseTitle}>{evalTitle.toUpperCase()}</Text>
            <Text style={styles.exerciseMeta}>{corporalPart}</Text>

            <View style={styles.metricsGrid}>
              {summaryMetrics.map((metric) => (
                <View key={metric.key} style={styles.metricItem}>
                  <Text style={styles.metricLabel}>{metric.label}</Text>
                  <Text style={styles.metricValue}>{metric.value}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>

          <View style={styles.formContainer}>
            {currentClient ? (
              <View style={styles.clientInfoContainer}>
                <Ionicons
                  name="person-circle-outline"
                  size={24}
                  color="#a855f7"
                  style={styles.clientInfoIcon}
                />
                <Text style={styles.clientGuardando}>
                  Guardando evaluación para:
                </Text>
                <Text style={styles.clientName}>{clientDisplayName}</Text>
                <Text style={styles.clientEmail}>{currentClient.email}</Text>
                <View style={styles.clientInfoDivider} />

                {!isSaved && (
                  <TouchableOpacity
                    style={styles.changeClientButton}
                    onPress={() => selectClient(null)}
                  >
                    <Text style={styles.changeClientText}>Cambiar paciente</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <ClientSearchInput
                userClients={userClients}
                onSelectClient={(clientItem) => {
                  selectClient(clientItem);
                  setSubmitError(null);
                }}
                accentColor="#a855f7"
              />
            )}

            <Text style={styles.inputLabel}>NOTAS</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              multiline
              placeholder="Añadí observaciones clínicas..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={notes}
              onChangeText={setNotes}
              editable={!isSaved && !isSubmitting}
            />

            {isSaved && (
              <View style={styles.successContainer}>
                <Ionicons name="checkmark-circle" size={20} color="#4BB543" />
                <Text style={styles.successText}>
                  Evaluación guardada para {clientDisplayName}
                </Text>
              </View>
            )}

            {submitError && !showStatusModal && (
              <View style={styles.errorContainer}>
                <Ionicons name="warning-outline" size={16} color="#ff5555" />
                <Text style={styles.errorText}>{submitError}</Text>
              </View>
            )}
          </View>

          <View style={styles.buttonContainer}>
            {isSaved ? (
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleCloseSuccess}
              >
                <LinearGradient
                  colors={["#2196F3", "#4CAF50"]}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.buttonText}>NUEVA EVALUACIÓN</Text>
                  <Ionicons name="arrow-forward" size={20} color="white" />
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.saveButton, isSubmitting && styles.disabledButton]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                <LinearGradient
                  colors={["#2196F3", "#4CAF50"]}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isSubmitting ? (
                    <>
                      <Text style={styles.buttonText}>GUARDANDO...</Text>
                      <ActivityIndicator color="white" />
                    </>
                  ) : (
                    <>
                      <Text style={styles.buttonText}>GUARDAR EVALUACIÓN</Text>
                      <Ionicons name="save-outline" size={20} color="white" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </ScrollView>

      <Modal
        visible={showStatusModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (isSaved) handleCloseSuccess();
          else setShowStatusModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.statusModal,
              isSaved ? styles.successModal : styles.errorModal,
            ]}
          >
            {isSaved ? (
              <>
                <Ionicons name="checkmark-circle" size={48} color="#4BB543" />
                <Text style={styles.modalTitle}>Guardado correctamente</Text>
                <Text style={styles.modalText}>
                  La evaluación quedó registrada para {clientDisplayName}.
                </Text>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={handleCloseSuccess}
                >
                  <Text style={styles.modalButtonText}>Continuar</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Ionicons name="warning" size={48} color="#FF5555" />
                <Text style={styles.modalTitle}>No se pudo guardar</Text>
                <Text style={styles.modalText}>{submitError}</Text>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonError]}
                  onPress={() => setShowStatusModal(false)}
                >
                  <Text style={styles.modalButtonText}>Reintentar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
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
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  headerButton: { flexDirection: "row" },
  backButton: { marginRight: 16 },
  headerTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  appIcon: { width: 32, height: 32, tintColor: "#a855f7", marginRight: 8 },
  scrollContent: { flexGrow: 1, paddingBottom: 24 },
  contentContainer: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 },
  summaryCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  exerciseTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  exerciseMeta: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  metricItem: {
    width: "48%",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  metricLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 6,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  metricValue: { color: "#ffffff", fontSize: 20, fontWeight: "bold" },
  formContainer: { marginBottom: 24 },
  clientInfoContainer: {
    backgroundColor: "rgba(44, 44, 44, 0.6)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.2)",
  },
  clientName: { color: "#a855f7", fontSize: 18, fontWeight: "bold", marginBottom: 8 },
  clientEmail: { color: "#ffffff", fontSize: 14, fontWeight: "500", marginBottom: 4 },
  clientGuardando: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    marginBottom: 4,
  },
  clientInfoDivider: {
    height: 1,
    backgroundColor: "rgba(168, 85, 247, 0.2)",
    marginVertical: 12,
    width: "100%",
  },
  clientInfoIcon: { position: "absolute", top: 16, right: 16 },
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
  multilineInput: { minHeight: 100, maxHeight: 200, textAlignVertical: "top" },
  buttonContainer: { marginBottom: 30 },
  saveButton: { borderRadius: 14, overflow: "hidden" },
  disabledButton: { opacity: 0.7 },
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
  errorText: { color: "#ff5555", fontSize: 14, fontWeight: "500", marginLeft: 8 },
  successContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(75, 181, 67, 0.1)",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(75, 181, 67, 0.3)",
  },
  successText: { color: "#4BB543", fontSize: 14, fontWeight: "500", marginLeft: 8 },
  changeClientButton: {
    marginTop: 8,
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  changeClientText: { color: "#a855f7", fontSize: 12, fontWeight: "500" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  statusModal: {
    width: "100%",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  successModal: {
    backgroundColor: "rgba(44, 44, 44, 0.9)",
    borderColor: "#4BB543",
    borderWidth: 1,
  },
  errorModal: {
    backgroundColor: "rgba(44, 44, 44, 0.9)",
    borderColor: "#FF5555",
    borderWidth: 1,
  },
  modalTitle: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  modalText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 8,
  },
  modalButton: {
    marginTop: 16,
    backgroundColor: "rgba(168, 85, 247, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.4)",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignSelf: "stretch",
  },
  modalButtonError: {
    backgroundColor: "rgba(255, 85, 85, 0.15)",
    borderColor: "rgba(255, 85, 85, 0.4)",
  },
  modalButtonText: {
    color: "#a855f7",
    fontWeight: "bold",
    fontSize: 14,
    textAlign: "center",
  },
});

export default SaveDataScreen;
