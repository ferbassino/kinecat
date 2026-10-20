import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Animated,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

const HistoryScreen = ({ navigation }) => {
  const [history, setHistory] = useState([]);
  const [fadeAnim] = useState(new Animated.Value(0)); // Animación simple alternativa

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const savedHistory = await AsyncStorage.getItem("stabilityResults");
        if (savedHistory) {
          setHistory(JSON.parse(savedHistory));
          // Animación de fade in simple
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }).start();
        }
      } catch (error) {
        console.error("Error loading history:", error);
      }
    };

    loadHistory();
  }, []);

  // Función para animación escalonada simple
  const getItemAnimationStyle = (index) => {
    return {
      opacity: fadeAnim,
      transform: [
        {
          translateY: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [50 * (index + 1), 0],
          }),
        },
      ],
    };
  };

  const renderItem = ({ item, index }) => (
    <Animated.View style={[styles.historyItem, getItemAnimationStyle(index)]}>
      <Text style={styles.historyTitle}>
        {item.exercise.name} • {new Date(item.date).toLocaleString()}
      </Text>
      <Text style={styles.metric}>CV: {item.cv.toFixed(2)}</Text>
      <Text style={styles.metric}>ApEn: {item.apEn.toFixed(2)}</Text>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Historial de evaluaciones</Text>
      <Text style={styles.localOnlyNotice}>
        Solo en este dispositivo. No se sincroniza con Kinecat web ni con la
        nube.
      </Text>

      {history.length > 0 ? (
        <FlatList
          data={history}
          renderItem={renderItem}
          keyExtractor={(_, index) => index.toString()}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <Text style={styles.emptyText}>
          Todavía no hay evaluaciones guardadas en este teléfono.
        </Text>
      )}

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>← Volver</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f0f",
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#00ffff",
    textAlign: "center",
    marginBottom: 12,
    marginTop: 50,
  },
  localOnlyNotice: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 12,
    lineHeight: 18,
  },
  historyItem: {
    backgroundColor: "#1a1a1a",
    padding: 18,
    borderRadius: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#2c2c2c",
    shadowColor: "#00ffff",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 5,
  },
  historyTitle: {
    color: "#a855f7",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  metric: {
    color: "#a3e635",
    fontSize: 14,
    marginBottom: 2,
  },
  emptyText: {
    color: "#666",
    textAlign: "center",
    marginTop: 60,
    fontSize: 16,
  },
  backButton: {
    marginTop: 30,
    backgroundColor: "#ec4899",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default HistoryScreen;
