import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { BASELINE_RMS_MG } from "../../auxiliaries/stabilityConstants";
import MetricHelpModal from "./MetricHelpModal";
import AngleHelpModal from "./AngleHelpModal";

const GlobalMetrics = ({
  cv,
  permutationEn,
  regularity,
  rms,
  isBaseline,
  interpretation,
  trendValue,
  permEnTrendValue,
  accentColor,
}) => {
  const [slideAnim] = useState(new Animated.Value(20));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [helpMetric, setHelpMetric] = useState(null);
  const [showAngleHelp, setShowAngleHelp] = useState(false);

  useEffect(() => {
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

  const getTrendLabel = (value) => {
    if (value === null || value === undefined) return "N/D";
    return value >= 0 ? "↑ AUMENTO" : "↓ DISMINUCIÓN";
  };

  const regularityValue =
    regularity != null ? regularity : 1 - permutationEn;

  const rmsInfo = interpretation?.rms ?? {
    label: "MAGNITUD",
    hint: "Aceleración filtrada",
  };
  const cvInfo = interpretation?.cv ?? {
    label: "N/D",
    hint: "Variabilidad relativa",
  };
  const permEnInfo = interpretation?.permEn ?? {
    label: "N/D",
    hint: "Patrón de oscilación",
  };
  const regularityInfo = interpretation?.regularity ?? {
    label: "N/D",
    hint: "1 − PermEn",
  };

  const baselineReference = {
    label: "REFERENCIA",
    hint: "Comparar durante el ejercicio",
  };

  const allMetrics = [
    {
      key: "rms",
      label: "RMS dinámico",
      value: `${((rms ?? 0) * 1000).toFixed(1)} mg`,
      badge: rmsInfo.label,
      hint: rmsInfo.hint,
      highlight: true,
      showInBaseline: true,
    },
    {
      key: "cv",
      label: "Variabilidad (CV)",
      value: `${cv.toFixed(2)}%`,
      badge: cvInfo.label,
      hint: cvInfo.hint,
      showInBaseline: true,
    },
    {
      key: "permEn",
      label: "Entropía (PermEn)",
      value: permutationEn.toFixed(3),
      badge: permEnInfo.label,
      hint: permEnInfo.hint,
      showInBaseline: true,
    },
    {
      key: "regularity",
      label: "Regularidad",
      value: regularityValue.toFixed(3),
      badge: regularityInfo.label,
      hint: regularityInfo.hint,
      showInBaseline: true,
    },
    {
      key: "cvTrend",
      label: "Tendencia CV",
      value: trendValue !== null ? `${trendValue.toFixed(1)}%` : "—",
      badge: isBaseline ? baselineReference.label : getTrendLabel(trendValue),
      hint: isBaseline ? baselineReference.hint : "Fatiga / adaptación",
      showInBaseline: false,
    },
    {
      key: "permTrend",
      label: "Tendencia PermEn",
      value:
        permEnTrendValue !== null ? `${permEnTrendValue.toFixed(1)}%` : "—",
      badge: isBaseline
        ? baselineReference.label
        : getTrendLabel(permEnTrendValue),
      hint: isBaseline ? baselineReference.hint : "Cambio temporal",
      showInBaseline: false,
    },
  ];

  const metrics = isBaseline
    ? allMetrics.filter((metric) => metric.showInBaseline)
    : allMetrics;

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
      <Text style={styles.sectionSubtitle}>
        {isBaseline
          ? `Baseline · RMS < ${BASELINE_RMS_MG} mg · Tocá cada tarjeta para ayuda`
          : "Tocá cada tarjeta para ver qué significa y qué esperar"}
      </Text>

      <TouchableOpacity
        style={styles.angleLink}
        onPress={() => setShowAngleHelp(true)}
        activeOpacity={0.7}
      >
        <Ionicons name="help-circle-outline" size={16} color="#00ffff" />
        <Text style={styles.angleLinkText}>
          ¿Influye el ángulo del cuerpo o la posición del teléfono?
        </Text>
      </TouchableOpacity>

      {isBaseline && (
        <View style={styles.baselineBanner}>
          <Text style={styles.baselineTitle}>ESTABLE (baseline)</Text>
          <Text style={styles.baselineText}>
            Solo ruido del sensor. CV y PermEn son referencia; interpretá RMS
            durante el ejercicio.
          </Text>
        </View>
      )}

      <View style={styles.metricsContainer}>
        {metrics.map((metric) => (
          <TouchableOpacity
            key={metric.key}
            activeOpacity={0.85}
            onPress={() => setHelpMetric(metric.key)}
            style={styles.metricTouchable}
          >
            <LinearGradient
              colors={["#2c2c2c", "#1a1a1a"]}
              style={[
                styles.metricCard,
                { borderLeftColor: accentColor },
                metric.highlight && styles.metricCardHighlight,
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.metricHeader}>
                <Text style={styles.metricLabel}>{metric.label}</Text>
                <Ionicons
                  name="information-circle-outline"
                  size={16}
                  color="rgba(255,255,255,0.35)"
                />
              </View>
              <Text style={styles.metricValue}>{metric.value}</Text>
              <View
                style={[styles.levelBadge, { backgroundColor: accentColor }]}
              >
                <Text style={styles.levelText}>{metric.badge}</Text>
              </View>
              <Text style={styles.metricHint}>{metric.hint}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>

      <MetricHelpModal
        visible={helpMetric != null}
        metricKey={helpMetric}
        isBaseline={isBaseline}
        onClose={() => setHelpMetric(null)}
      />

      <AngleHelpModal
        visible={showAngleHelp}
        onClose={() => setShowAngleHelp(false)}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
    letterSpacing: 1.5,
  },
  sectionSubtitle: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 11,
    marginBottom: 8,
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  angleLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
    paddingVertical: 4,
  },
  angleLinkText: {
    color: "#00ffff",
    fontSize: 11,
    fontWeight: "500",
    flex: 1,
    textDecorationLine: "underline",
  },
  baselineBanner: {
    backgroundColor: "rgba(0, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(0, 255, 255, 0.25)",
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  baselineTitle: {
    color: "#00ffff",
    fontSize: 13,
    fontWeight: "bold",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  baselineText: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 11,
    lineHeight: 16,
  },
  metricsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  metricTouchable: {
    width: "48%",
    marginBottom: 12,
  },
  metricCard: {
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  metricCardHighlight: {
    borderLeftWidth: 5,
  },
  metricHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  metricLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
    paddingRight: 4,
  },
  metricValue: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
  },
  levelBadge: {
    alignSelf: "flex-start",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 6,
  },
  levelText: {
    color: "#000",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  metricHint: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
  },
});

export default GlobalMetrics;
