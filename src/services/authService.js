// src/services/authService.js
import client from "../api/client";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const signIn = async (email, password) => {
  try {
    const response = await client.post("/sign-in", { email, password });

    if (response.data.success) {
      const user = response.data.user;
      await AsyncStorage.setItem("user", JSON.stringify(user));
      return { success: true, user };
    }
    return { success: false, error: response.data.error };
  } catch (error) {
    console.error("Error en signIn:", error);
    return {
      success: false,
      error: error.response?.data?.error || "Error de conexión",
    };
  }
};

export const signOut = async () => {
  try {
    await AsyncStorage.removeItem("user");
    return { success: true };
  } catch (error) {
    console.error("Error en signOut:", error);
    return { success: false, error: "Error al cerrar sesión" };
  }
};

export const getCurrentUser = async () => {
  try {
    const user = await AsyncStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    return null;
  }
};
