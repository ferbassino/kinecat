import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Linking,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "./AuthContext";
import { signIn } from "../services/authService";

const { width } = Dimensions.get("window");

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));
  const [fadeAnimForm] = useState(new Animated.Value(0));
  const [slideAnimForm] = useState(new Animated.Value(30));

  const { login } = useAuth();

  useEffect(() => {
    // Animación de entrada del header
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Animación de entrada del formulario con delay
    Animated.parallel([
      Animated.timing(fadeAnimForm, {
        toValue: 1,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnimForm, {
        toValue: 0,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Por favor completa todos los campos");
      return;
    }

    setIsLoading(true);
    setError("");

    const result = await signIn(email, password);

    if (result.success) {
      try {
        await login(result.user);
        navigation.replace("Home");
      } catch (loginError) {
        setError(loginError.message || "No se pudo iniciar la sesión");
      }
      setIsLoading(false);
      return;
    }

    setIsLoading(false);

    if (!result.success) {
      setError(result.error || "Credenciales incorrectas");
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <LinearGradient colors={["#0f0f0f", "#1a1a1a"]} style={styles.container}>
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>INICIAR SESIÓN</Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.formContainer,
          {
            opacity: fadeAnimForm,
            transform: [{ translateY: slideAnimForm }],
          },
        ]}
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
          autoCorrect={false}
        />

        <Text style={styles.label}>CONTRASEÑA</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.input, styles.passwordInput]}
            placeholder="••••••••"
            placeholderTextColor="#666"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity style={styles.eyeIcon} onPress={toggleShowPassword}>
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={20}
              color="#666"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
          disabled={isLoading}
        >
          <LinearGradient
            colors={["#00ffff", "#00b4d8"]}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text style={styles.buttonText}>INGRESAR</Text>
                <Ionicons name="log-in" size={20} color="white" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.registerLink}
          onPress={() => Linking.openURL("https://gestion-baskin.vercel.app/")}
        >
          <Text style={styles.registerText}>
            No estas registrado? Visita BASKIN
          </Text>
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
    fontWeight: "bold",
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
    fontWeight: "500",
    marginLeft: 10,
    flex: 1,
  },
  label: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 8,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: "#2c2c2c",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    color: "#ffffff",
    fontSize: 16,
  },
  passwordContainer: {
    position: "relative",
    marginBottom: 20,
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeIcon: {
    position: "absolute",
    right: 16,
    top: 16,
    padding: 8,
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
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  registerLink: {
    marginTop: 20,
    alignSelf: "center",
  },
  registerText: {
    color: "#00ffff",
    fontSize: 14,
    fontWeight: "500",
    textDecorationLine: "underline",
  },
});

export default LoginScreen;
