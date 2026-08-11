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

const angleColor = (angle, isPitch) => {
  if (isPitch) {
    if (angle < 60) return "#a855f7";
    if (angle < 120) return "#ec4899";
    return "#ef4444";
  } else {
    return angle > 0 ? "#a3e635" : "#00ffff";
  }
};

const Clinometer = () => {
  const [angles, setAngles] = useState({ pitch: 0, roll: 0 });
  const [isExpanded, setIsExpanded] = useState(false);
  const subscriptionRef = useRef(null);

  // Calculamos los porcentajes con useMemo para optimización
  const { pitchPercentage, rollPercentage } = useMemo(() => {
    return {
      pitchPercentage: (angles.pitch / 180) * 100,
      rollPercentage: (Math.abs(angles.roll) / 90) * 100,
    };
  }, [angles.pitch, angles.roll]);

  useEffect(() => {
    const handleAccelerometerData = (accelerometerData) => {
      const { x, y, z } = accelerometerData;

      // Cálculo optimizado de ángulos
      const pitchRad = Math.atan2(z, Math.sqrt(x * x + y * y));
      const rollRad = Math.atan2(x, Math.sqrt(y * y + z * z));

      // Convertir a grados y redondear
      const pitch = Math.round(pitchRad * (180 / Math.PI));
      const roll = Math.round(rollRad * (180 / Math.PI));

      // Ajuste especial para el pitch (0-180°)
      const adjustedPitch = 180 - Math.max(0, Math.min(180, pitch + 90));

      setAngles({
        pitch: adjustedPitch,
        roll: roll,
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
            name={isExpanded ? "chevron-down" : "chevron-up"}
            size={20}
            color="#00ffff"
          />
          <Text style={styles.headerText}>CLINÓMETRO</Text>
          <Text style={styles.anglePreview}>
            {angles.pitch}° / {angles.roll}°
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.content}>
          <View style={styles.anglesContainer}>
            {/* Sección Pitch (Vertical) */}
            <View style={styles.verticalAngleContainer}>
              <View style={styles.angleHeader}>
                <Ionicons name="swap-vertical" size={20} color="#ec4899" />
                <Text style={styles.angleTitle}>FRONTAL (0-180°)</Text>
              </View>
              <Text style={styles.angleValue}>{angles.pitch}°</Text>

              <View style={styles.verticalAngleBarContainer}>
                <View style={styles.verticalAngleBar}>
                  <View
                    style={[
                      styles.verticalAngleFill,
                      {
                        height: `${pitchPercentage}%`,
                        backgroundColor: angleColor(angles.pitch, true),
                      },
                    ]}
                  />
                </View>
                <View style={styles.angleScale}>
                  <Text style={styles.scaleText}>180°</Text>
                  <Text style={styles.scaleText}>90°</Text>
                  <Text style={styles.scaleText}>0°</Text>
                </View>
              </View>
            </View>

            <View style={styles.separator} />

            {/* Sección Roll (Horizontal) */}
            <View style={styles.horizontalAngleContainer}>
              <View style={styles.angleHeader}>
                <Ionicons name="swap-horizontal" size={20} color="#a3e635" />
                <Text style={styles.angleTitle}>LATERAL (±90°)</Text>
              </View>
              <Text style={styles.angleValue}>{angles.roll}°</Text>

              <View style={styles.horizontalAngleBarContainer}>
                <View style={styles.angleScaleHorizontal}>
                  <Text style={styles.scaleText}>-90°</Text>
                  <Text style={styles.scaleText}>0°</Text>
                  <Text style={styles.scaleText}>90°</Text>
                </View>
                <View style={styles.horizontalAngleBar}>
                  <View style={styles.horizontalAngleCenter} />
                  <View
                    style={[
                      styles.horizontalAngleFill,
                      {
                        width: `${rollPercentage}%`,
                        backgroundColor: angleColor(angles.roll, false),
                        left:
                          angles.roll > 0 ? "50%" : `${50 - rollPercentage}%`,
                        right:
                          angles.roll < 0 ? "50%" : `${50 - rollPercentage}%`,
                      },
                    ]}
                  />
                </View>
              </View>
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
  anglePreview: {
    color: "#ffffff",
    fontSize: 14,
    fontFamily: "Inter-SemiBold",
  },
  content: {
    backgroundColor: "rgba(30, 30, 30, 0.8)",
    padding: 16,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  anglesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: height * 0.3,
  },
  verticalAngleContainer: {
    flex: 1,
    alignItems: "center",
  },
  horizontalAngleContainer: {
    flex: 1,
    alignItems: "center",
  },
  separator: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginHorizontal: 12,
  },
  angleHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    justifyContent: "center",
  },
  angleTitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    fontFamily: "Inter-SemiBold",
    marginLeft: 8,
  },
  angleValue: {
    color: "#ffffff",
    fontSize: 28,
    fontFamily: "Inter-Bold",
    textAlign: "center",
    marginVertical: 8,
  },
  verticalAngleBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  verticalAngleBar: {
    width: 30,
    height: 150,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 15,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  verticalAngleFill: {
    width: "100%",
    borderRadius: 15,
  },
  horizontalAngleBarContainer: {
    alignItems: "center",
    marginTop: 10,
  },
  horizontalAngleBar: {
    width: 150,
    height: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
  },
  horizontalAngleCenter: {
    position: "absolute",
    left: "50%",
    width: 2,
    height: "100%",
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  horizontalAngleFill: {
    height: "100%",
    borderRadius: 10,
    position: "absolute",
  },
  angleScale: {
    marginLeft: 8,
    height: 150,
    justifyContent: "space-between",
  },
  angleScaleHorizontal: {
    width: 150,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  scaleText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 10,
  },
});

export default Clinometer;
