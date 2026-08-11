import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../../auth/AuthContext";
import ScreenLayout from "../../../components/ScreenLayout";
import gyroArrays from "../auxiliaries/gyroArrays";
import gyroProcess from "../auxiliaries/gyroProcess";
import ArtroChart from "../components/ArtroChart";
import {
  formatMovementLabel,
  formatSegmentLabel,
  formatSideLabel,
} from "../auxiliaries/artroHelpers";

const ResultsScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const {
    segment,
    side,
    movement,
    corporalPart,
    gyroData,
    testTimeInput,
  } = route.params;
  const { user } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const angles = useMemo(() => {
    const { gyroX, gyroY, gyroZ, arrayGyroTime } = gyroArrays(
      gyroData,
      testTimeInput,
    );
    const processed = gyroProcess(
      gyroX,
      gyroY,
      gyroZ,
      arrayGyroTime,
      testTimeInput,
    );

    return {
      x: Math.abs(processed.xCountGradAngle),
      y: Math.abs(processed.yCountGradAngle),
      z: Math.abs(processed.zCountGradAngle),
      xArray: processed.xArrayGradAngle,
      yArray: processed.yArrayGradAngle,
      zArray: processed.zArrayGradAngle,
    };
  }, [gyroData, testTimeInput]);

  const handleSave = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    navigation.navigate("ArtroSaveData", {
      segment,
      side,
      movement,
      corporalPart,
      gyroData,
      testTimeInput,
      xAngle: angles.x,
      yAngle: angles.y,
      zAngle: angles.z,
    });
  };

  const metrics = [
    { key: "x", label: "Ángulo X", value: `${angles.x.toFixed(1)}°` },
    { key: "y", label: "Ángulo Y", value: `${angles.y.toFixed(1)}°` },
    { key: "z", label: "Ángulo Z", value: `${angles.z.toFixed(1)}°` },
    {
      key: "primary",
      label: "ROM principal (X)",
      value: `${angles.x.toFixed(1)}°`,
    },
  ];

  return (
    <LinearGradient colors={["#0f0f0f", "#1a1a1a"]} style={styles.container}>
      <ScreenLayout bottomInset>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerButton}>
          <TouchableOpacity
            onPress={() => navigation.navigate("ArtroEvaluationSetup")}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={20} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>RESULTADOS</Text>
        </View>
        <Image
          source={require("../../../assets/e_icono.png")}
          style={styles.appIcon}
          resizeMode="contain"
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={["#2c2c2c", "#1a1a1a"]}
          style={styles.summaryCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.evalTitle}>
            {formatSegmentLabel(segment)} · {formatMovementLabel(movement)}
          </Text>
          {side ? (
            <Text style={styles.evalSubtitle}>{formatSideLabel(side)}</Text>
          ) : null}
          <Text style={styles.evalMeta}>{corporalPart}</Text>
        </LinearGradient>

        <View style={styles.metricsGrid}>
          {metrics.map((metric) => (
            <View key={metric.key} style={styles.metricItem}>
              <Text style={styles.metricLabel}>{metric.label}</Text>
              <Text style={styles.metricValue}>{metric.value}</Text>
            </View>
          ))}
        </View>

        <ArtroChart
          title="Curva ángulo / tiempo"
          ordenadas1={angles.xArray}
          ordenadas2={angles.yArray}
          ordenadas3={angles.zArray}
        />

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleSave}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["#2196F3", "#4CAF50"]}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.buttonText}>GUARDAR EVALUACIÓN</Text>
            <Ionicons name="save-outline" size={20} color="white" />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate("ArtroEvaluationSetup")}
        >
          <Text style={styles.secondaryButtonText}>Nueva evaluación</Text>
          <Ionicons name="refresh" size={18} color="#a855f7" />
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={showLoginModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLoginModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Ionicons name="lock-closed" size={40} color="#a855f7" />
            <Text style={styles.modalTitle}>Sesión requerida</Text>
            <Text style={styles.modalText}>
              Iniciá sesión y seleccioná un paciente para guardar la evaluación.
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowLoginModal(false);
                navigation.navigate("Login");
              }}
            >
              <Text style={styles.modalButtonText}>Iniciar sesión</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowLoginModal(false)}>
              <Text style={styles.modalCancel}>Cancelar</Text>
            </TouchableOpacity>
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
  scrollContent: { padding: 24, paddingBottom: 40 },
  summaryCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  evalTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  evalSubtitle: { color: "#a855f7", fontSize: 15, marginTop: 6 },
  evalMeta: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    marginTop: 4,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
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
  primaryButton: { borderRadius: 14, overflow: "hidden", marginTop: 24 },
  gradient: {
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
  secondaryButton: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.3)",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(168, 85, 247, 0.1)",
  },
  secondaryButtonText: {
    color: "#a855f7",
    fontSize: 16,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: "#2c2c2c",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  modalTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  modalText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: "rgba(168, 85, 247, 0.2)",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.4)",
    marginBottom: 12,
  },
  modalButtonText: {
    color: "#a855f7",
    fontWeight: "bold",
    textAlign: "center",
  },
  modalCancel: { color: "rgba(255,255,255,0.5)", fontSize: 14 },
});

export default ResultsScreen;
