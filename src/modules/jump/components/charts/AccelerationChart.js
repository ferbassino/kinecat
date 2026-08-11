import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Svg, Path, G, Line, Text as SvgText } from "react-native-svg";
import * as d3Shape from "d3-shape";

const { width } = Dimensions.get("window");

const AccelerationChart = ({ accelerationData = [], timeData = [] }) => {
  if (
    !accelerationData?.length ||
    !timeData?.length ||
    accelerationData.length !== timeData.length
  ) {
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.sectionTitle}>ACELERACIÓN VERTICAL</Text>
        <View
          style={[
            styles.chart,
            { height: 280, justifyContent: "center", alignItems: "center" },
          ]}
        >
          <Text style={{ color: "rgba(255,255,255,0.5)" }}>
            Datos no disponibles
          </Text>
        </View>
      </View>
    );
  }

  // Configuración del gráfico
  const GRAPH_HEIGHT = 280;
  const GRAPH_WIDTH = width - 60;
  const MARGIN_LEFT = 40;
  const MARGIN_RIGHT = 20;
  const MARGIN_TOP = 20;
  const MARGIN_BOTTOM = 30;
  const CHART_WIDTH = GRAPH_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
  const CHART_HEIGHT = GRAPH_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM;

  // Normalización de datos
  const normalizedTime = timeData.map((t) => t - timeData[0]);
  const maxTime = Math.max(...normalizedTime);
  const maxAcc = Math.max(...accelerationData);

  const safeMaxTime = maxTime === 0 ? 1 : maxTime;
  const safeMaxAcc = maxAcc === 0 ? 1 : Math.abs(maxAcc);

  // Escalas
  const xScale = (value) => MARGIN_LEFT + (value / safeMaxTime) * CHART_WIDTH;

  const yScale = (value) =>
    MARGIN_TOP +
    CHART_HEIGHT -
    ((value + safeMaxAcc) / (safeMaxAcc * 2)) * CHART_HEIGHT; // reescalado entre -max y +max

  // Generador de línea
  const lineGenerator = d3Shape
    .line()
    .x((_, i) => xScale(normalizedTime[i]))
    .y((d) => yScale(d))
    .curve(d3Shape.curveLinear);

  const accLine = lineGenerator(accelerationData);

  // Generación de ejes
  const generateXAxis = () => {
    const steps = 5;
    const stepValue = maxTime / steps;
    return Array.from({ length: steps + 1 }).map((_, i) => {
      const value = i * stepValue;
      return (
        <G key={`x-axis-${i}`}>
          <SvgText
            x={xScale(value)}
            y={yScale(0) + 20}
            fill="rgba(255,255,255,0.7)"
            fontSize="10"
            textAnchor="middle"
          >
            {value.toFixed(2)}s
          </SvgText>
        </G>
      );
    });
  };

  const generateYAxis = () => {
    const steps = 5;
    const stepValue = (maxAcc * 1.2) / steps;
    return Array.from({ length: steps + 1 }).map((_, i) => {
      const value = i * stepValue;
      return (
        <G key={`y-axis-${i}`}>
          <SvgText
            x={MARGIN_LEFT - 8}
            y={yScale(value) + 4}
            fill="rgba(255,255,255,0.7)"
            fontSize="10"
            textAnchor="end"
          >
            {value.toFixed(2)} m/s²
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
      );
    });
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(200).duration(800)}
      style={styles.chartContainer}
    >
      <Text style={styles.sectionTitle}>ACELERACIÓN VERTICAL</Text>
      <View style={[styles.chart, { height: GRAPH_HEIGHT }]}>
        <Svg width={GRAPH_WIDTH} height={GRAPH_HEIGHT}>
          <Path
            d={`M0,0 H${GRAPH_WIDTH} V${GRAPH_HEIGHT} H0 Z`}
            fill="#1a1a1a"
          />
          {generateYAxis()}
          {generateXAxis()}
          <Path d={accLine} fill="none" stroke="#00ffff" strokeWidth="3" />
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
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  chart: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    marginVertical: 8,
    overflow: "hidden",
  },
  sectionTitle: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    marginBottom: 15,
    letterSpacing: 1.5,
    textAlign: "center",
  },
});

export default AccelerationChart;
