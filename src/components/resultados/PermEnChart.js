import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Dimensions, Animated } from "react-native";
import { Svg, Path, G, Line, Text as SvgText, Circle } from "react-native-svg";
import * as d3Shape from "d3-shape";
import { SECONDS_PER_WINDOW } from "../../auxiliaries/stabilityConstants";
import {
  buildYAxisTicks,
  computePaddedYDomain,
  createYScale,
} from "./chartScale";

const { width } = Dimensions.get("window");

function calculatePermEnTrend(data) {
  const n = data.length;
  if (n < 2) {
    return { trendValues: [], trendPercentage: 0 };
  }

  const xValues = Array.from({ length: n }, (_, i) => i + 1);
  const xSum = xValues.reduce((a, b) => a + b, 0);
  const ySum = data.reduce((a, b) => a + b, 0);
  const xySum = xValues.reduce((acc, x, i) => acc + x * data[i], 0);
  const xxSum = xValues.reduce((acc, x) => acc + x * x, 0);

  const slope = (n * xySum - xSum * ySum) / (n * xxSum - xSum * xSum);
  const intercept = (ySum - slope * xSum) / n;
  const trendValues = xValues.map((x) => slope * x + intercept);

  const initialTrendValue = trendValues[0];
  const finalTrendValue = trendValues[trendValues.length - 1];
  const trendPercentage =
    initialTrendValue !== 0
      ? ((finalTrendValue - initialTrendValue) / initialTrendValue) * 100
      : 0;

  return { trendValues, trendPercentage };
}

const PermEnChart = ({ ventanas, accentColor = "#FF6BFF" }) => {
  const [slideAnim] = useState(new Animated.Value(20));
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Animación de entrada con delay
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        delay: 400,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        delay: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const SEGUNDOS_POR_VENTANA = SECONDS_PER_WINDOW;
  const GRAPH_HEIGHT = 280;
  const GRAPH_WIDTH = width - 60;
  const MARGIN_LEFT = 40;
  const MARGIN_RIGHT = 20;
  const MARGIN_TOP = 20;
  const MARGIN_BOTTOM = 30;
  const CHART_WIDTH = GRAPH_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
  const CHART_HEIGHT = GRAPH_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM;

  const timeLabels = ventanas.map(
    (window) => window.timeStartSec ?? 0,
  );
  const permEnValues = ventanas.map((w) => w?.permEn ?? 0);

  const avgPermEn =
    permEnValues.reduce((a, b) => a + b, 0) / permEnValues.length;
  const maxPermEn = Math.max(...permEnValues);
  const minPermEn = Math.min(...permEnValues);

  const { trendValues, trendPercentage } = calculatePermEnTrend(permEnValues);
  const xDomain = [0, timeLabels[timeLabels.length - 1] || 1];
  const yDomain = computePaddedYDomain([...permEnValues, ...trendValues]);

  const xScale = (value) => MARGIN_LEFT + (value / xDomain[1]) * CHART_WIDTH;
  const yScale = createYScale(yDomain, MARGIN_TOP, CHART_HEIGHT);
  const xAxisY = MARGIN_TOP + CHART_HEIGHT;

  const lineGenerator = d3Shape
    .line()
    .x((_, i) => xScale(timeLabels[i]))
    .y((d) => yScale(d))
    .curve(d3Shape.curveLinear);

  const linePermEn = lineGenerator(permEnValues);

  const generateXAxis = () => {
    const step = Math.ceil(timeLabels.length / 5);
    return timeLabels.map((label, i) => {
      if (i % step === 0) {
        return (
          <G key={`x-axis-${i}`}>
            <SvgText
              x={xScale(label)}
              y={xAxisY + 20}
              fill="rgba(255,255,255,0.7)"
              fontSize="10"
              textAnchor="middle"
            >
              {label}s
            </SvgText>
          </G>
        );
      }
      return null;
    });
  };

  const generateYAxis = () => {
    return buildYAxisTicks(yDomain, 5).map((value, i) => (
      <G key={`y-axis-${i}`}>
        <SvgText
          x={MARGIN_LEFT - 8}
          y={yScale(value) + 4}
          fill="rgba(255,255,255,0.7)"
          fontSize="10"
          textAnchor="end"
        >
          {value.toFixed(3)}
        </SvgText>
        <Line
          x1={MARGIN_LEFT}
          y1={yScale(value)}
          x2={MARGIN_LEFT + CHART_WIDTH}
          y2={yScale(value)}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
        />
      </G>
    ));
  };

  // Puntos del gráfico
  const generateDots = () => {
    return permEnValues.map((value, i) => (
      <Circle
        key={`dot-${i}`}
        cx={xScale(timeLabels[i])}
        cy={yScale(value)}
        r="4"
        fill={accentColor}
        stroke="#fff"
        strokeWidth="1"
      />
    ));
  };

  const trendLine =
    trendValues.length > 0 ? lineGenerator(trendValues) : "";
  const trendText =
    trendPercentage >= 0
      ? `+${trendPercentage.toFixed(1)}%`
      : `${trendPercentage.toFixed(1)}%`;

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
      <Text style={styles.sectionTitle}>ENTROPÍA POR PERMUTACIÓN (PermEn)</Text>
      <Text style={styles.axisHint}>Eje Y ajustado al rango de datos</Text>

      <View style={[styles.chartContainer, { height: GRAPH_HEIGHT }]}>
        <Svg width={GRAPH_WIDTH} height={GRAPH_HEIGHT}>
          {/* Fondo */}
          <Path
            d={`M0,0 H${GRAPH_WIDTH} V${GRAPH_HEIGHT} H0 Z`}
            fill="#1a1a1a"
          />

          {/* Ejes y líneas de guía */}
          {generateYAxis()}

          {/* Línea de PermEn */}
          <Path d={linePermEn} fill="none" stroke={accentColor} strokeWidth="3" />
          <Path
            d={trendLine}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            strokeDasharray="4,4"
          />

          {/* Puntos */}
          {generateDots()}

          {/* Eje X */}
          {generateXAxis()}

          {/* Borde del gráfico */}
          <Line
            x1={MARGIN_LEFT}
            y1={MARGIN_TOP}
            x2={MARGIN_LEFT}
            y2={MARGIN_TOP + CHART_HEIGHT}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1"
          />
          <Line
            x1={MARGIN_LEFT}
            y1={MARGIN_TOP + CHART_HEIGHT}
            x2={MARGIN_LEFT + CHART_WIDTH}
            y2={MARGIN_TOP + CHART_HEIGHT}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1"
          />
        </Svg>
      </View>

      {/* Información */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          Promedio: {avgPermEn.toFixed(3)} | Máximo: {maxPermEn.toFixed(3)} |
          Mínimo: {minPermEn.toFixed(3)} | Tendencia: {trendText}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  chartContainer: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    marginVertical: 8,
    overflow: "hidden",
  },
  sectionTitle: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    marginBottom: 4,
    letterSpacing: 1.5,
    textAlign: "center",
  },
  axisHint: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 10,
    marginBottom: 12,
    textAlign: "center",
  },
  infoContainer: {
    marginTop: 15,
    paddingHorizontal: 10,
  },
  infoText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    marginBottom: 3,
    textAlign: "center",
  },
});

export default PermEnChart;
