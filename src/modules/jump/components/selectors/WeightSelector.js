import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Keyboard,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const WeightSelector = ({ onWeightSelected }) => {
  const [weight, setWeight] = useState("");
  const [showSelector, setShowSelector] = useState(true);

  const handleWeightChange = (text) => {
    // Permite números y un punto decimal
    const cleanedText = text.replace(/[^0-9.]/g, "");

    // Verifica que solo haya un punto decimal
    const decimalCount = (cleanedText.match(/\./g) || []).length;
    if (decimalCount <= 1) {
      setWeight(cleanedText);
    }
  };

  const handleConfirm = () => {
    Keyboard.dismiss();

    if (!weight) {
      Alert.alert("Error", "Por favor ingresa tu peso");
      return;
    }

    const weightValue = parseFloat(weight);

    if (isNaN(weightValue)) {
      Alert.alert("Error", "Peso inválido");
      return;
    }

    if (weightValue < 30 || weightValue > 200) {
      Alert.alert("Error", "El peso debe estar entre 30kg y 200kg");
      return;
    }

    setShowSelector(false);
    onWeightSelected(weightValue);
  };

  if (!showSelector) return null;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#1a1a1a", "#2a2a2a"]}
        style={styles.selectorContainer}
      >
        <Text style={styles.title}>INGRESA TU PESO</Text>
        <Text style={styles.subtitle}>
          Usa punto (.) para decimales. Ej: 72.5
        </Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="70.0"
            value={weight}
            onChangeText={handleWeightChange}
            autoFocus={true}
            maxLength={6}
          />
          <Text style={styles.unit}>kg</Text>
        </View>

        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
          <LinearGradient
            colors={["#00ffaa", "#00cc88"]}
            style={styles.buttonGradient}
          >
            <Text style={styles.confirmText}>CONFIRMAR</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  selectorContainer: {
    padding: 25,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  title: {
    color: "white",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 10,
    fontWeight: "bold",
  },
  subtitle: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: "#00ffff",
    paddingHorizontal: 20,
  },
  input: {
    color: "#00ffff",
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    padding: 10,
    minWidth: 100,
  },
  unit: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 20,
    marginLeft: 5,
  },
  confirmButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 10,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  confirmText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default WeightSelector;
