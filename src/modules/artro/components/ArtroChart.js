import React from "react";
import { Text, StyleSheet, Dimensions, View } from "react-native";
import { LineChart } from "react-native-chart-kit";

const ArtroChart = ({
  ordenadas1 = [],
  ordenadas2 = [],
  ordenadas3 = [],
  title = "",
}) => {
  const safeSeries = (series) =>
    series.length ? series : [0];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <LineChart
        data={{
          labels: [],
          datasets: [
            {
              data: safeSeries(ordenadas1),
              color: () => "#ff5555",
              strokeWidth: 2,
            },
            {
              data: safeSeries(ordenadas2),
              color: () => "#4ade80",
              strokeWidth: 2,
            },
            {
              data: safeSeries(ordenadas3),
              color: () => "#60a5fa",
              strokeWidth: 2,
            },
          ],
        }}
        width={Dimensions.get("window").width - 48}
        height={220}
        withDots={false}
        withShadow={false}
        withInnerLines={false}
        chartConfig={{
          backgroundColor: "#1a1a1a",
          backgroundGradientFrom: "#2c2c2c",
          backgroundGradientTo: "#1a1a1a",
          decimalPlaces: 1,
          color: () => "rgba(255,255,255,0.8)",
          labelColor: () => "rgba(255,255,255,0.5)",
          propsForBackgroundLines: {
            stroke: "rgba(255,255,255,0.08)",
          },
        }}
        bezier
        style={styles.chart}
      />
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#ff5555" }]} />
          <Text style={styles.legendText}>Eje X</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#4ade80" }]} />
          <Text style={styles.legendText}>Eje Y</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#60a5fa" }]} />
          <Text style={styles.legendText}>Eje Z</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginVertical: 8 },
  title: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 12,
    textAlign: "center",
  },
  chart: { borderRadius: 16 },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginTop: 12,
  },
  legendItem: { flexDirection: "row", alignItems: "center" },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  legendText: { color: "rgba(255,255,255,0.6)", fontSize: 12 },
});

export default ArtroChart;
