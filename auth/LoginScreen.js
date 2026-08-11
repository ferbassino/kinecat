import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import {
  useFonts,
  Inter_700Bold,
  Inter_500Medium,
} from "@expo-google-fonts/inter";
import { useAuth } from "./AuthContext";

const { width } = Dimensions.get("window");

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const [fontsLoaded] = useFonts({
    "Inter-Bold": Inter_700Bold,
    "Inter-Medium": Inter_500Medium,
  });

  const handleLogin = () => {
    if (!email || !password) {
      setError("Por favor completa todos los campos");
      return;
    }

    const success = login(email, password);
    if (!success) {
      setError("Credenciales incorrectas");
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <LinearGradient colors={["#0f0f0f", "#1a1a1a"]} style={styles.container}>
      <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>INICIAR SESIÓN</Text>
      </Animated.View>

      <Animated.View
        entering={FadeInUp.delay(200).duration(600)}
        style={styles.formContainer}
      >
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning" size={20} color="#f87171" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Text style={styles.label}>CORREO ELECTRÓNICO</Text>
        <TextInput
          style={styles.input}
          placeholder="tu@email.com"
          placeholderTextColor="#666"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>CONTRASEÑA</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor="#666"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <LinearGradient
            colors={["#00ffff", "#00b4d8"]}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.buttonText}>INGRESAR</Text>
            <Ionicons name="log-in" size={20} color="white" />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.registerLink}
          onPress={() => navigation.navigate("Register")}
        >
          <Text style={styles.registerText}>¿No tienes cuenta? Regístrate</Text>
        </TouchableOpacity>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 50,
    paddingBottom: 30,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    color: "#ffffff",
    fontSize: 20,
    fontFamily: "Inter-Bold",
    letterSpacing: 1,
  },
  formContainer: {
    marginTop: 30,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(248, 113, 113, 0.1)",
    borderLeftWidth: 3,
    borderLeftColor: "#f87171",
    padding: 12,
    marginBottom: 20,
    borderRadius: 6,
  },
  errorText: {
    color: "#f87171",
    fontSize: 14,
    fontFamily: "Inter-Medium",
    marginLeft: 10,
    flex: 1,
  },
  label: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontFamily: "Inter-Medium",
    marginBottom: 8,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: "#2c2c2c",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    color: "#ffffff",
    fontFamily: "Inter-Medium",
  },
  loginButton: {
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 10,
  },
  gradient: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: "Inter-Medium",
    letterSpacing: 0.5,
  },
  registerLink: {
    marginTop: 20,
    alignItems: "center",
  },
  registerText: {
    color: "#a855f7",
    fontSize: 14,
    fontFamily: "Inter-Medium",
  },
});

export default LoginScreen;
