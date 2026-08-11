import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Accelerometer } from "expo-sensors";

const { height } = Dimensions.get("window");

// Función para determinar el color basado en la intensidad de la aceleración
const accelerationColor = (value, maxValue = 2) => {
  const absValue = Math.min(Math.abs(value), maxValue);
  const ratio = absValue / maxValue;

  // Rojo (alto) -> Amarillo (medio) -> Verde (bajo)
  if (ratio > 0.66) return "#ef4444"; // Rojo
  if (ratio > 0.33) return "#f59e0b"; // Amarillo
  return "#10b981"; // Verde
};

// Función para formatear el valor con espacio fijo
const formatAccelerationValue = (value) => {
  // Aseguramos que siempre ocupe el mismo espacio (5 caracteres)
  const numStr = value.toFixed(1); // Siempre 2 decimales
  return numStr.padStart(5, " "); // Rellena con espacios si es necesario
};

const AccelerationMeter = () => {
  const [accelerations, setAccelerations] = useState({ x: 0, y: 0, z: 0 });
  const [isExpanded, setIsExpanded] = useState(false);
  const subscriptionRef = useRef(null);

  // Calculamos los porcentajes para las barras
  const { xPercentage, yPercentage, zPercentage } = useMemo(() => {
    const maxAcceleration = 2; // Valor máximo para normalizar
    return {
      xPercentage:
        (Math.min(Math.abs(accelerations.x), maxAcceleration) /
          maxAcceleration) *
        100,
      yPercentage:
        (Math.min(Math.abs(accelerations.y), maxAcceleration) /
          maxAcceleration) *
        100,
      zPercentage:
        (Math.min(Math.abs(accelerations.z), maxAcceleration) /
          maxAcceleration) *
        100,
    };
  }, [accelerations]);

  useEffect(() => {
    const handleAccelerometerData = (accelerometerData) => {
      const { x, y, z } = accelerometerData;
      setAccelerations({
        x: Math.round(x * 100) / 100,
        y: Math.round(y * 100) / 100,
        z: Math.round(z * 100) / 100,
      });
    };

    Accelerometer.setUpdateInterval(100);
    subscriptionRef.current = Accelerometer.addListener(
      handleAccelerometerData
    );

    return () => {
      subscriptionRef.current?.remove();
    };
  }, []);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={toggleExpand} activeOpacity={0.8}>
        <LinearGradient
          colors={["#2c2c2c", "#1a1a1a"]}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Ionicons
            name={!isExpanded ? "chevron-down" : "chevron-up"}
            size={20}
            color="#00ffff"
          />
          <Text style={styles.headerText}>Acelerómetro</Text>
          <Text style={styles.accelerationPreview}>
            X:{formatAccelerationValue(accelerations.x)} Y:
            {formatAccelerationValue(accelerations.y)} Z:
            {formatAccelerationValue(accelerations.z)}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.content}>
          <View style={styles.axesContainer}>
            {/* Eje X */}
            <View style={styles.axisContainer}>
              <Text style={styles.axisTitle}>Eje X</Text>
              <View style={styles.valueContainer}>
                <Text style={styles.axisValue}>
                  {formatAccelerationValue(accelerations.x)}
                </Text>
              </View>
              <View style={styles.verticalBarContainer}>
                <View style={styles.verticalBar}>
                  <View
                    style={[
                      styles.verticalBarFill,
                      {
                        height: `${xPercentage}%`,
                        backgroundColor: accelerationColor(accelerations.x),
                      },
                    ]}
                  />
                </View>
              </View>
              <Text style={styles.axisLabel}>Izquierda/Derecha</Text>
            </View>

            {/* Eje Y */}
            <View style={styles.axisContainer}>
              <Text style={styles.axisTitle}>Eje Y</Text>
              <View style={styles.valueContainer}>
                <Text style={styles.axisValue}>
                  {formatAccelerationValue(accelerations.y)}
                </Text>
              </View>
              <View style={styles.verticalBarContainer}>
                <View style={styles.verticalBar}>
                  <View
                    style={[
                      styles.verticalBarFill,
                      {
                        height: `${yPercentage}%`,
                        backgroundColor: accelerationColor(accelerations.y),
                      },
                    ]}
                  />
                </View>
              </View>
              <Text style={styles.axisLabel}>Adelante/Atrás</Text>
            </View>

            {/* Eje Z */}
            <View style={styles.axisContainer}>
              <Text style={styles.axisTitle}>Eje Z</Text>
              <View style={styles.valueContainer}>
                <Text style={styles.axisValue}>
                  {formatAccelerationValue(accelerations.z)}
                </Text>
              </View>
              <View style={styles.verticalBarContainer}>
                <View style={styles.verticalBar}>
                  <View
                    style={[
                      styles.verticalBarFill,
                      {
                        height: `${zPercentage}%`,
                        backgroundColor: accelerationColor(accelerations.z),
                      },
                    ]}
                  />
                </View>
              </View>
              <Text style={styles.axisLabel}>Arriba/Abajo</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: "hidden",
    width: "100%",
    alignSelf: "center",
  },
  headerGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  headerText: {
    color: "#ffffff",
    fontSize: 14,
    fontFamily: "Inter-SemiBold",
    marginLeft: 10,
    flex: 1,
  },
  accelerationPreview: {
    color: "#ffffff",
    fontSize: 14,
    fontFamily: "Inter-SemiBold",
    letterSpacing: 1, // Mejora la legibilidad de los valores fijos
  },
  content: {
    backgroundColor: "rgba(30, 30, 30, 0.8)",
    padding: 16,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  axesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: height * 0.25,
  },
  axisContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  axisTitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 16,
    fontFamily: "Inter-Bold",
    marginBottom: 4,
  },
  valueContainer: {
    width: 60, // Ancho fijo para los valores
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  axisValue: {
    color: "#ffffff",
    fontSize: 18,
    fontFamily: "Inter-SemiBold",
    textAlign: "center",
    includeFontPadding: false, // Evita espacio adicional
    fontVariant: ["tabular-nums"], // Usa números de ancho fijo
  },
  axisLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontFamily: "Inter-Regular",
    marginTop: 8,
    textAlign: "center",
  },
  verticalBarContainer: {
    alignItems: "center",
    justifyContent: "flex-end",
    flex: 1,
    width: "100%",
  },
  verticalBar: {
    width: 30,
    height: 150,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 15,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  verticalBarFill: {
    width: "100%",
    borderRadius: 15,
  },
});

export default AccelerationMeter;
