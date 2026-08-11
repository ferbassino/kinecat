import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Svg, Path, G, Line, Text as SvgText } from "react-native-svg";
import * as d3Shape from "d3-shape";

const { width } = Dimensions.get("window");

const KinematicChart = ({
  timeData = [],
  accelerationData = [],
  velocityData = [],
  displacementData = [],
  title = "",
}) => {
  // Función mejorada para limpieza de datos
  const cleanData = (arr) => {
    return arr
      .map((val) => {
        const num = Number(val);
        return isNaN(num) ? 0 : num;
      })
      .filter((val) => typeof val === "number");
  };

  // Limpieza de datos de entrada
  const cleanedTimeData = cleanData(timeData);
  const cleanedAccData = cleanData(accelerationData);
  const cleanedVelData = cleanData(velocityData);
  const cleanedDispData = cleanData(displacementData);

  // Validación de datos mejorada
  const hasValidData =
    cleanedTimeData.length > 0 &&
    (cleanedAccData.length === cleanedTimeData.length ||
      cleanedVelData.length === cleanedTimeData.length ||
      cleanedDispData.length === cleanedTimeData.length);

  if (!hasValidData) {
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={[styles.chart, styles.centered]}>
          <Text style={styles.placeholderText}>Datos no disponibles</Text>
        </View>
      </View>
    );
  }

  // Configuración del gráfico
  const GRAPH_HEIGHT = 300;
  const GRAPH_WIDTH = width - 60;
  const MARGIN_LEFT = 50;
  const MARGIN_RIGHT = 20;
  const MARGIN_TOP = 20;
  const MARGIN_BOTTOM = 40;
  const CHART_WIDTH = GRAPH_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
  const CHART_HEIGHT = GRAPH_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM;

  // Normalización de tiempos (empezando desde 0)
  const normalizedTime = cleanedTimeData.map((t) => t - cleanedTimeData[0]);
  const maxTime = Math.max(...normalizedTime) || 1; // Evitar división por cero

  // Escalado de valores para el eje Y (combinado)
  const allYValues = [...cleanedAccData, ...cleanedVelData, ...cleanedDispData];

  const yMin = Math.min(...allYValues, 0); // por si todos los valores son positivos
  const yMax = Math.max(...allYValues, 1); // mínimo de 1 para evitar división por cero
  const yRange = yMax - yMin || 1; // evitar rango 0

  // Funciones de escalado protegidas
  const xScale = (value) => MARGIN_LEFT + (value / maxTime) * CHART_WIDTH;
  const yScale = (value) =>
    MARGIN_TOP + CHART_HEIGHT - ((value - yMin) / yRange) * CHART_HEIGHT;

  // Generador de líneas mejorado
  const lineGenerator = (data) => {
    if (!data || data.length !== cleanedTimeData.length) return "M0,0";

    try {
      const validPoints = data.map((val, i) => {
        const x = xScale(normalizedTime[i]);
        const y = yScale(val);
        return [x, y];
      });

      const line = d3Shape
        .line()
        .x((d) => d[0])
        .y((d) => d[1])
        .curve(d3Shape.curveCatmullRom.alpha(0.5))(validPoints);

      return typeof line === "string" ? line : "M0,0";
    } catch (e) {
      console.error("Error generating line:", e);
      return "M0,0";
    }
  };

  // Generación de ejes
  const generateXAxis = () => {
    const steps = 5;
    return Array.from({ length: steps + 1 }).map((_, i) => {
      const value = (i * maxTime) / steps;
      return (
        <G key={`x-${i}`}>
          <Line
            x1={xScale(value)}
            y1={yScale(0)}
            x2={xScale(value)}
            y2={yScale(0) + 5}
            stroke="white"
            strokeWidth={1}
          />
          <SvgText
            x={xScale(value)}
            y={yScale(0) + 20}
            fill="rgba(255,255,255,0.7)"
            fontSize={10}
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
    return Array.from({ length: steps + 1 }).map((_, i) => {
      const value = yMin + (i * yRange) / steps;
      return (
        <G key={`y-${i}`}>
          <Line
            x1={MARGIN_LEFT}
            y1={yScale(value)}
            x2={MARGIN_LEFT + CHART_WIDTH}
            y2={yScale(value)}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={1}
          />
          <SvgText
            x={MARGIN_LEFT - 8}
            y={yScale(value) + 4}
            fill="rgba(255,255,255,0.7)"
            fontSize={10}
            textAnchor="end"
          >
            {value.toFixed(1)}
          </SvgText>
        </G>
      );
    });
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(200).duration(800)}
      style={styles.chartContainer}
    >
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={[styles.chart, { height: GRAPH_HEIGHT }]}>
        <Svg width={GRAPH_WIDTH} height={GRAPH_HEIGHT}>
          {/* Fondo */}
          <Path
            d={`M0,0 H${GRAPH_WIDTH} V${GRAPH_HEIGHT} H0 Z`}
            fill="#1a1a1a"
          />

          {/* Ejes y grid */}
          {generateYAxis()}
          {generateXAxis()}

          {/* Línea cero */}
          <Line
            x1={MARGIN_LEFT}
            y1={yScale(0)}
            x2={MARGIN_LEFT + CHART_WIDTH}
            y2={yScale(0)}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth={1}
            strokeDasharray="4,2"
          />

          {/* Series de datos con validación adicional */}
          {cleanedAccData.length === cleanedTimeData.length && (
            <Path
              d={lineGenerator(cleanedAccData)}
              fill="none"
              stroke="#FF6B6B"
              strokeWidth={2.5}
            />
          )}

          {cleanedVelData.length === cleanedTimeData.length && (
            <Path
              d={lineGenerator(cleanedVelData)}
              fill="none"
              stroke="#4ECDC4"
              strokeWidth={2.5}
            />
          )}

          {cleanedDispData.length === cleanedTimeData.length && (
            <Path
              d={lineGenerator(cleanedDispData)}
              fill="none"
              stroke="#FFD166"
              strokeWidth={2.5}
            />
          )}

          {/* Leyenda */}
          <G x={MARGIN_LEFT + 10} y={MARGIN_TOP + 10}>
            {cleanedAccData.length > 0 && (
              <G>
                <Line
                  x1={0}
                  y1={0}
                  x2={30}
                  y2={0}
                  stroke="#FF6B6B"
                  strokeWidth={2}
                />
                <SvgText x={40} y={4} fill="#FF6B6B" fontSize={10}>
                  Aceleración (m/s²)
                </SvgText>
              </G>
            )}

            {cleanedVelData.length > 0 && (
              <G y={15}>
                <Line
                  x1={0}
                  y1={0}
                  x2={30}
                  y2={0}
                  stroke="#4ECDC4"
                  strokeWidth={2}
                />
                <SvgText x={40} y={4} fill="#4ECDC4" fontSize={10}>
                  Velocidad (m/s)
                </SvgText>
              </G>
            )}

            {cleanedDispData.length > 0 && (
              <G y={30}>
                <Line
                  x1={0}
                  y1={0}
                  x2={30}
                  y2={0}
                  stroke="#FFD166"
                  strokeWidth={2}
                />
                <SvgText x={40} y={4} fill="#FFD166" fontSize={10}>
                  Desplazamiento (m)
                </SvgText>
              </G>
            )}
          </G>
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
  centered: {
    justifyContent: "center",
    alignItems: "center",
    height: 280,
  },
  placeholderText: {
    color: "rgba(255,255,255,0.5)",
  },
  sectionTitle: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    marginBottom: 15,
    letterSpacing: 1.5,
    textAlign: "center",
  },
});

export default KinematicChart;
