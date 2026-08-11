import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import MainHeader from "../components/headers/MainHeader";
import ExerciseHeader from "../components/headers/ExerciseHeader";
import ActionButton from "../components/buttons/ActionButton";
import AccelerationChart from "../components/charts/AccelerationChart";
import KinematicChart from "../components/charts/KinematicChart";
import { exerciseData } from "../auxiliaries/objects/exerciseData";
import jumpProcess from "./../auxiliaries/jumpProcess";
import InvalidJumpModal from "../components/errorModal/InvalidJumpModal";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../../auth/AuthContext";

const JumpResults = ({ route, navigation }) => {
  const { user, currentClient } = useAuth();

  const {
    accY = [],
    accT = [],
    testTimeInput = 0,
    exercise = "",
    bodyWeight = 0,
    accResultante = [],
    currentData = [],
    legSide = "",
  } = route.params || {};
  const [showInvalidModal, setShowInvalidModal] = useState(false);
  const [jumpData, setJumpData] = useState({
    arrayYF: [],
    xAxisArray: [],
    flightTime: 0,
    flightHeight: 0,
    takeoffSpeed: 0,
    powerW: 0,
    force: 0,
    distanciaPropulsiva: 0,
    tiempoPropulsivo: 0,
    rSI: 0,
  });
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const { cMJDataObject = {} } =
      jumpProcess(accY, testTimeInput, bodyWeight, accT) || {};
    if (!cMJDataObject.validated) {
      setShowInvalidModal(true);
    }

    setJumpData({
      velocity: cMJDataObject.velocity,
      velocidadPonderada: cMJDataObject.velocidadPonderada,
      displacement: cMJDataObject.displacement,
      arrayY13: cMJDataObject.arrayY13,
      arrayY13T: cMJDataObject.arrayY13T,
      arrayYF: cMJDataObject.arrayY0F || [],
      xAxisArray: cMJDataObject.cMJXAxis || [],
      flightTime: cMJDataObject.tV || 0,
      flightHeight: cMJDataObject.alturaVuelo || 0,
      takeoffSpeed: cMJDataObject.velD || 0,
      takeoffPropSpeed: cMJDataObject.takeOffVelocityCalculated || 0,
      powerW: cMJDataObject.meanPropulsivePower || 0,
      force: cMJDataObject.meanPropulsiveForce || 0,
      distanciaPropulsiva: cMJDataObject.distanciaPropulsiva || 0,
      tiempoPropulsivo: cMJDataObject.tiempoPropulsivo || 0,
      rSI: cMJDataObject.rSI || 0,
      propulsiveAcceleration: cMJDataObject.propulsiveAcceleration,
      propulsiveAccTime: cMJDataObject.propulsiveAccTime,
      eccPeakVelocity: cMJDataObject.eccPeakVelocity,
      eccPeakForce: cMJDataObject.eccPeakForce,
      eccPeakForceBM: cMJDataObject.eccPeakForceBM,
      eccRFD: cMJDataObject.eccRFD,
      eccRFDBM: cMJDataObject.eccRFDBM,
      eccPeakPower: cMJDataObject.eccPeakPower,
      eccPeakPowerBM: cMJDataObject.eccPeakPowerBM,
      conPeakForce: cMJDataObject.conPeakForce,
      conPeakForceBM: cMJDataObject.conPeakForceBM,
      conPeakPower: cMJDataObject.conPeakPower,
      conPeakPowerBM: cMJDataObject.conPeakPowerBM,

      validated: cMJDataObject.validated,
    });
  }, [accY, testTimeInput]);

  const renderMetricItem = (value, label, unit = "") => (
    <View style={styles.metricItem}>
      <Text style={styles.metricValue}>
        {value} {unit}
      </Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );

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

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <ExerciseHeader exercise={exercise} exerciseData={exerciseData} />
        <KinematicChart
          timeData={accT}
          accelerationData={accY}
          title={"SALTO COMPLETO"}
        />

        <KinematicChart
          timeData={jumpData.arrayY13T}
          accelerationData={jumpData.arrayY13}
          velocityData={jumpData.velocidadPonderada}
          displacementData={jumpData.displacement}
          title={"FASE EXÉNTRICA - CONCÉNTRICA"}
        />

        {/*  --------------- Métricas de interes ------------- */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(800)}
          style={styles.metricsContainer}
        >
          <Text style={styles.sectionTitle}>METRICAS DE INTERES</Text>
          <View style={styles.metricsGrid}>
            {renderMetricItem(
              Math.abs(jumpData.eccPeakPowerBM),
              "Pico de potencia excéntrica / BM",
              "W/kg"
            )}
            {renderMetricItem(jumpData.eccRFDBM, "eRFD / BM", "N /kg")}
            {renderMetricItem(
              jumpData.conPeakPowerBM,
              "Pico de potencia / BM",
              "W"
            )}
            {renderMetricItem(jumpData.rSI, "RSI modificado")}
          </View>
        </Animated.View>
        {/*  --------------- Fase excéntrica ------------- */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(800)}
          style={styles.metricsContainer}
        >
          <Text style={styles.sectionTitle}>FASE EXCÉNTRICA</Text>
          <View style={styles.metricsGrid}>
            {renderMetricItem(
              jumpData.eccPeakVelocity,
              "Velocidad máxima excéntrica",
              "m/s"
            )}
            {renderMetricItem(
              jumpData.eccPeakForce,
              "Pico de fuerza excéntrica",
              "N"
            )}
            {renderMetricItem(
              jumpData.eccPeakForceBM,
              "Pico de fuerza excéntrica /BM",
              "N"
            )}
            {renderMetricItem(jumpData.eccRFD, "eRFD", "N")}
            {renderMetricItem(jumpData.eccRFDBM, "eRFD / BM", "N")}
            {renderMetricItem(
              jumpData.eccPeakPower,
              "Pico de Potencia excéntrica",
              "W"
            )}
            {renderMetricItem(
              jumpData.eccPeakPowerBM,
              "Pico de Potencia excéntrica / BM",
              "W"
            )}
          </View>
        </Animated.View>
        {/* Fase propulsiva */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(800)}
          style={styles.metricsContainer}
        >
          <Text style={styles.sectionTitle}>FASE CONCÉNTRICA</Text>
          <View style={styles.metricsGrid}>
            {renderMetricItem(
              jumpData.tiempoPropulsivo,
              "Tiempo propulsivo",
              "s"
            )}
            {renderMetricItem(jumpData.distanciaPropulsiva, "Distancia", "m")}
            {renderMetricItem(jumpData.force, "Fuerza media propulsiva", "N")}
            {renderMetricItem(jumpData.conPeakForce, "Pico de fuerza", "N")}
            {renderMetricItem(
              jumpData.conPeakForceBM,
              "Pico de fuerza BM",
              "N"
            )}
            {renderMetricItem(
              jumpData.powerW,
              "Potencia media propulsiva",
              "W"
            )}
            {renderMetricItem(jumpData.conPeakPower, "Pico de potencia ", "W")}
            {renderMetricItem(
              jumpData.conPeakPowerBM,
              "Pico de potencia / BM",
              "W"
            )}
          </View>
        </Animated.View>

        {/* Fase de vuelo */}
        <Animated.View
          entering={FadeInDown.delay(600).duration(800)}
          style={styles.metricsContainer}
        >
          <Text style={styles.sectionTitle}>FASE DE VUELO</Text>
          <View style={styles.metricsGrid}>
            {renderMetricItem(jumpData.flightHeight, "Altura máxima", "m")}
            {renderMetricItem(jumpData.flightTime, "Tiempo de vuelo", "s")}
            {renderMetricItem(
              jumpData.takeoffSpeed,
              "Velocidad despegue",
              "m/s"
            )}
            {renderMetricItem(
              jumpData.takeoffPropSpeed,
              "Velocidad despegue calculada",
              "m/s"
            )}
            {renderMetricItem(jumpData.rSI, "RSI modificado")}
          </View>
        </Animated.View>

        <View style={styles.buttonContainer}>
          <ActionButton
            onPress={() => navigation.navigate("JumpExercise")}
            text="EVALUAR MISMO SALTO"
            iconName="repeat-outline"
            colors={["#00ffff", "#00b4d8"]}
          />
        </View>

        <View style={styles.buttonContainer}>
          <ActionButton
            onPress={() => navigation.navigate("JumpExerciseSelection")}
            text="EVALUAR NUEVO SALTO"
            iconName="ellipsis-vertical-circle-outline"
            colors={["#a855f7", "#7e22ce"]}
          />
        </View>
        <View style={styles.marginBottom} />
        <View style={styles.buttonContainer}>
          <ActionButton
            onPress={() => {
              if (!user) {
                setShowModal(true);
                return;
              }
              navigation.navigate("JumpSaveData", {
                exercise,
                currentData,
                bodyWeight,
                side: legSide,
                jumpMetrics: {
                  eccPeakVelocity: jumpData.eccPeakVelocity,
                  eccPeakForce: jumpData.eccPeakForce,
                  eccPeakForceBM: jumpData.eccPeakForceBM,
                  eccRFD: jumpData.eccRFD,
                  eccRFDBM: jumpData.eccRFDBM,
                  eccPeakPower: jumpData.eccPeakPower,
                  eccPeakPowerBM: jumpData.eccPeakPowerBM,
                  tiempoPropulsivo: jumpData.tiempoPropulsivo,
                  distanciaPropulsiva: jumpData.distanciaPropulsiva,
                  meanForce: jumpData.force,
                  conPeakForce: jumpData.conPeakForce,
                  conPeakForceBM: jumpData.conPeakForceBM,
                  meanPower: jumpData.powerW,
                  conPeakPower: jumpData.conPeakPower,
                  conPeakPowerBM: jumpData.conPeakPowerBM,
                  flightHeight: jumpData.flightHeight,
                  flightTime: jumpData.flightTime,
                  takeoffSpeed: jumpData.takeoffSpeed,
                  takeoffPropSpeed: jumpData.takeoffPropSpeed,
                  rSI: jumpData.rSI,
                },
              });
            }}
            text="GUARDAR EVALUACIÓN"
            iconName="save-outline"
            colors={["#2196F3", "#4CAF50"]}
          />
        </View>
        <View style={styles.marginBottom} />
      </ScrollView>

      <InvalidJumpModal
        visible={showInvalidModal}
        onRetry={() => {
          setShowInvalidModal(false);
          navigation.navigate("JumpExercise", { exercise });
        }}
        onClose={() => setShowInvalidModal(false)}
      />
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
  },
  // header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
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
  scrollContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  metricsContainer: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  metricItem: {
    width: "48%",
    marginBottom: 15,
    alignItems: "center",
  },
  metricValue: {
    color: "#ffffff",
    fontSize: 18,
    fontFamily: "Inter-Bold",
    marginBottom: 5,
  },
  metricLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontFamily: "Inter-Regular",
    textAlign: "center",
  },
  buttonContainer: {
    marginTop: 10,
  },
  marginBottom: {
    marginBottom: 40,
  },
  sectionTitle: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    marginBottom: 15,
    letterSpacing: 1.5,
    textAlign: "center",
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
    fontWeight: "bold",
    fontSize: 14,
  },
});

export default JumpResults;
