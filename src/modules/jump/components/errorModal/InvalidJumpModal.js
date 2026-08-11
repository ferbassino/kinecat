import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

const { width, height } = Dimensions.get("window");

const InvalidJumpModal = ({ visible, onRetry, onClose }) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <Animated.View
          entering={FadeIn.duration(300)}
          style={styles.modalBackground}
        />

        <Animated.View
          entering={FadeInDown.duration(500).springify()}
          style={styles.modalContainer}
        >
          <LinearGradient
            colors={["#1a1a1a", "#2a2a2a"]}
            style={styles.gradientContainer}
          >
            {/* Icono de advertencia */}
            <View style={styles.iconContainer}>
              <Ionicons name="warning" size={60} color="#ff5555" />
            </View>

            {/* Título */}
            <Text style={styles.modalTitle}>SALTO INVÁLIDO</Text>

            {/* Mensaje */}
            <Text style={styles.modalText}>
              El salto no se realizó correctamente. Por favor, inténtalo
              nuevamente asegurándote de:
            </Text>

            {/* Lista de recomendaciones */}
            <View style={styles.tipsContainer}>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={16} color="#00ffff" />
                <Text style={styles.tipText}>Ejecutar la técnica correcta</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={16} color="#00ffff" />
                <Text style={styles.tipText}>
                  Mantener posición estática desde que se presiona el boton:
                  "TOCA PARA COMENZAR"
                </Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={16} color="#00ffff" />
                <Text style={styles.tipText}>
                  Comenzar luego de la indicación: "AHORA"
                </Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={16} color="#00ffff" />
                <Text style={styles.tipText}>
                  Esperar en posición estática al final del salto hasta que diga
                  "PRUEBA FINALIZADA"
                </Text>
              </View>
            </View>

            {/* Botones */}
            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={[styles.button, styles.retryButton]}
                onPress={onRetry}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["#ff5555", "#ff0000"]}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="refresh" size={20} color="white" />
                  <Text style={styles.buttonText}>REINTENTAR</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.closeButton]}
                onPress={onRetry}
                activeOpacity={0.8}
              >
                <Text style={[styles.buttonText, { color: "#ff5555" }]}>
                  CERRAR
                </Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBackground: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  modalContainer: {
    width: width * 0.9,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  gradientContainer: {
    padding: 25,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: {
    color: "#ff5555",
    fontSize: 22,
    fontFamily: "Inter-Bold",
    textAlign: "center",
    marginBottom: 15,
    letterSpacing: 1,
  },
  modalText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  tipsContainer: {
    marginBottom: 25,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  tipText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    marginLeft: 10,
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    borderRadius: 12,
    overflow: "hidden",
    height: 50,
  },
  retryButton: {
    flex: 1,
    marginRight: 10,
  },
  closeButton: {
    width: 100,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 85, 85, 0.1)",
    borderWidth: 1,
    borderColor: "#ff5555",
  },
  buttonGradient: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  buttonText: {
    color: "white",
    fontSize: 14,
    fontFamily: "Inter-Bold",
    marginLeft: 10,
  },
});

export default InvalidJumpModal;
