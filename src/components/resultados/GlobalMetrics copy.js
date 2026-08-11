import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const GlobalMetrics = ({ cv, permutationEn, trendValue, accentColor }) => {
  const [slideAnim] = useState(new Animated.Value(20));
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Animación de entrada
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getLevel = (value, ranges) => {
    if (value < ranges.low) return "BAJO";
    if (value < ranges.medium) return "MEDIO";
    return "ALTO";
  };

  const cvLevel = getLevel(cv, { low: 2, medium: 10 });
  const apEnLevel = getLevel(permutationEn, { low: 0.3, medium: 0.6 });
  const trendLevel =
    trendValue !== null
      ? trendValue >= 0
        ? "↑ AUMENTO"
        : "↓ DISMINUCIÓN"
      : "N/D";

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Text style={styles.sectionTitle}>MÉTRICAS GLOBALES</Text>

      <View style={styles.metricsContainer}>
        {/* Tarjeta CV */}
        <LinearGradient
          colors={["#2c2c2c", "#1a1a1a"]}
          style={[styles.metricCard, { borderLeftColor: accentColor }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.metricLabel}>Variabilidad</Text>
          <Text style={styles.metricValue}>{cv.toFixed(2)}%</Text>
          <View style={[styles.levelBadge, { backgroundColor: accentColor }]}>
            <Text style={styles.levelText}>{cvLevel}</Text>
          </View>
        </LinearGradient>

        {/* Tarjeta PermEn */}
        {/* <LinearGradient
          colors={["#2c2c2c", "#1a1a1a"]}
          style={[styles.metricCard, { borderLeftColor: accentColor }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.metricLabel}>Regularidad</Text>
          <Text style={styles.metricValue}>{permutationEn.toFixed(3)}</Text>
          <View style={[styles.levelBadge, { backgroundColor: accentColor }]}>
            <Text style={styles.levelText}>{apEnLevel}</Text>
          </View>
        </LinearGradient> */}
        <LinearGradient
          colors={["#2c2c2c", "#1a1a1a"]}
          style={[styles.metricCard, { borderLeftColor: accentColor }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.metricLabel}>Tendencia CV</Text>
          <Text style={styles.metricValue}>{trendValue.toFixed(3)}</Text>
          <View style={[styles.levelBadge, { backgroundColor: accentColor }]}>
            <Text style={styles.levelText}>{trendLevel}</Text>
          </View>
        </LinearGradient>

        {/* Nueva Tarjeta de Tendencia */}
        {/* {trendValue !== null && (
          <LinearGradient
            colors={["#2c2c2c", "#1a1a1a"]}
            style={[
              styles.metricCard,
              { borderLeftColor: accentColor, marginTop: 15, width: "100%" },
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.metricLabel}>Tendencia CV</Text>
            <Text style={styles.metricValue}>
              {trendValue >= 0
                ? `+${trendValue.toFixed(1)}%`
                : `${trendValue.toFixed(1)}%`}
            </Text>
            <View style={[styles.levelBadge, { backgroundColor: accentColor }]}>
              <Text style={styles.levelText}>{trendLevel}</Text>
            </View>
          </LinearGradient>
        )} */}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 30,
  },
  sectionTitle: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontFamily: "Inter-SemiBold",
    marginBottom: 15,
    letterSpacing: 1.5,
  },
  metricsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  metricCard: {
    width: "48%",
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
    marginBottom: 15,
  },
  metricLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontFamily: "Inter-SemiBold",
    marginBottom: 5,
  },
  metricValue: {
    color: "#ffffff",
    fontSize: 28,
    fontFamily: "Inter-Bold",
    marginBottom: 10,
  },
  levelBadge: {
    alignSelf: "flex-start",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  levelText: {
    color: "#000",
    fontSize: 12,
    fontFamily: "Inter-Bold",
  },
});

export default GlobalMetrics;
