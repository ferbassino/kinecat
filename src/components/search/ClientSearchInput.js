import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../auth/AuthContext";

const ClientSearchInput = ({
  userClients = [],
  onSelectClient,
  accentColor = "#00ffff",
}) => {
  const [searchText, setSearchText] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [slideAnim] = useState(new Animated.Value(20));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [resultsAnim] = useState(new Animated.Value(0));

  const { user } = useAuth();

  useEffect(() => {
    // Animación de entrada del input
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const filteredClients = useMemo(() => {
    if (!searchText.trim()) return [];

    return userClients.filter((clientItem) => {
      const fullName = `${clientItem.name} ${clientItem.surname}`.toLowerCase();
      return fullName.includes(searchText.toLowerCase());
    });
  }, [searchText, userClients]);

  useEffect(() => {
    if (filteredClients.length > 0 && user) {
      Animated.timing(resultsAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      resultsAnim.setValue(0);
    }
  }, [filteredClients.length, user]);

  const handleSelectClient = (client) => {
    setSearchText(`${client.name} ${client.surname}`);
    resultsAnim.setValue(0);
    onSelectClient && onSelectClient(client);
  };

  const handleInputPress = () => {
    if (!user) {
      setShowModal(true);
      return false; // Evita que el teclado se abra
    }
    setIsFocused(true);
    return true;
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <Text style={styles.label}>BUSCAR PACIENTE</Text>
        <TouchableOpacity activeOpacity={1} onPress={handleInputPress}>
          <LinearGradient
            colors={["rgba(255,255,255,0.05)", "rgba(255,255,255,0.02)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.inputContainer,
              isFocused && { borderColor: accentColor },
            ]}
          >
            <Ionicons
              name="search"
              size={20}
              color={isFocused ? accentColor : "rgba(255,255,255,0.5)"}
            />
            <TextInput
              style={styles.input}
              placeholder="Nombre o apellido..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={searchText}
              onChangeText={setSearchText}
              onFocus={() => (user ? setIsFocused(true) : null)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              editable={!!user} // Deshabilita el input si no hay usuario
            />
            {searchText.length > 0 && user && (
              <TouchableOpacity onPress={() => setSearchText("")}>
                <Ionicons
                  name="close-circle"
                  size={20}
                  color="rgba(255,255,255,0.5)"
                />
              </TouchableOpacity>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {user && filteredClients.length > 0 && (
        <Animated.View
          style={[
            styles.resultsContainer,
            {
              opacity: resultsAnim,
              transform: [
                {
                  translateY: resultsAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-10, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={["#1a1a1a", "#2c2c2c"]}
            style={styles.resultsGradient}
          >
            <FlatList
              data={filteredClients}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.clientItem}
                  onPress={() => handleSelectClient(item)}
                >
                  <Text style={styles.clientName}>
                    {item.name} {item.surname}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color="rgba(255,255,255,0.5)"
                  />
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              keyboardShouldPersistTaps="always"
            />
          </LinearGradient>
        </Animated.View>
      )}

      {/* Modal para usuarios no registrados */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showModal}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={["#2c2c2c", "#1a1a1a"]}
              style={styles.modalContent}
            >
              <Ionicons
                name="lock-closed"
                size={40}
                color="#FF5555"
                style={styles.modalIcon}
              />
              <Text style={styles.modalTitle}>Función no disponible</Text>
              <Text style={styles.modalText}>
                La opción de guardar datos de pacientes solo está disponible
                para usuarios registrados.
              </Text>

              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.modalButtonText}>Entendido</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    position: "relative",
    zIndex: 10,
  },
  label: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 8,
    letterSpacing: 1,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  input: {
    flex: 1,
    color: "#ffffff",
    fontWeight: "500",
    marginLeft: 10,
    fontSize: 14,
  },
  resultsContainer: {
    position: "absolute",
    top: 70,
    left: 0,
    right: 0,
    maxHeight: 200,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#00ffff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  resultsGradient: {
    paddingVertical: 8,
  },
  clientItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  clientName: {
    color: "#ffffff",
    fontWeight: "500",
    fontSize: 14,
  },
  separator: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    marginHorizontal: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "80%",
    borderRadius: 16,
    overflow: "hidden",
  },
  modalContent: {
    padding: 24,
    alignItems: "center",
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  modalText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButton: {
    backgroundColor: "rgba(255, 85, 85, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(255, 85, 85, 0.5)",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  modalButtonText: {
    color: "#FF5555",
    fontWeight: "bold",
    fontSize: 14,
  },
});

export default ClientSearchInput;
