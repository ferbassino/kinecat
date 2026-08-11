// src/auth/AuthContext.js
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import client from "../api/client";
import { fetchUserClients } from "../services/user";
import {
  fetchEvaluationPlanByClient,
  getEnabledModuleIdsFromPlan,
} from "../services/evaluationPlan";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userClients, setUserClients] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientsError, setClientsError] = useState(null);
  const [currentClient, setCurrentClient] = useState(null);
  const [evaluationPlan, setEvaluationPlan] = useState(null);
  const [evaluationPlanLoading, setEvaluationPlanLoading] = useState(false);

  const clearSession = useCallback(async () => {
    await AsyncStorage.removeItem("user");
    setUser(null);
    setUserClients([]);
    setCurrentClient(null);
    setEvaluationPlan(null);
    setClientsError(null);
  }, []);

  const loadUserClients = useCallback(async (userId) => {
    if (!userId) return;

    setClientsLoading(true);
    setClientsError(null);

    try {
      const clients = await fetchUserClients(userId);
      setUserClients(clients);
      return clients;
    } catch (error) {
      console.error("Error cargando clientes:", error);
      setClientsError(error.message || "Error al cargar clientes");

      if (error.status === 401 || error.response?.status === 401) {
        await clearSession();
      }
    } finally {
      setClientsLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) {
          const userData = JSON.parse(storedUser);

          if (userData?.token && userData?.id) {
            setUser(userData);
            await loadUserClients(userData.id);
          } else {
            await AsyncStorage.removeItem("user");
          }
        }
      } catch (error) {
        console.error("Error al cargar la sesión:", error);
        await clearSession();
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, [loadUserClients, clearSession]);

  const register = useCallback(async (email, password) => {
    try {
      const response = await client.post("/sign-up", { email, password });

      if (response.data.success) {
        const userData = response.data.user;
        await AsyncStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
        return { success: true };
      }
      return { success: false, error: response.data.error };
    } catch (error) {
      console.error("Error en registro:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Error en la conexión",
      };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await clearSession();
      return { success: true };
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      return { success: false, error: "Error al cerrar sesión" };
    }
  }, [clearSession]);

  const login = useCallback(async (userData) => {
    if (!userData?.token || !userData?.id) {
      throw new Error("Datos de sesión inválidos");
    }

    await AsyncStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    return await loadUserClients(userData.id);
  }, [loadUserClients]);

  const refreshClients = useCallback(async (userId) => {
    const id = userId || user?.id;
    if (id) {
      return await loadUserClients(id);
    }
    return [];
  }, [loadUserClients, user?.id]);

  const loadEvaluationPlan = useCallback(async (clientId) => {
    if (!clientId) {
      setEvaluationPlan(null);
      return null;
    }

    setEvaluationPlanLoading(true);

    try {
      const response = await fetchEvaluationPlanByClient(clientId);
      const plan = response?.data || null;
      setEvaluationPlan(plan);
      return plan;
    } catch (error) {
      console.warn("No se pudo cargar el plan KinApp del paciente:", error);
      setEvaluationPlan(null);
      return null;
    } finally {
      setEvaluationPlanLoading(false);
    }
  }, []);

  const selectClient = useCallback(
    async (clientItem) => {
      setCurrentClient(clientItem);

      if (clientItem?._id) {
        await loadEvaluationPlan(clientItem._id);
      } else {
        setEvaluationPlan(null);
      }
    },
    [loadEvaluationPlan],
  );

  const handleUser = useCallback(async (nextUser) => {
    setUser(nextUser);
    if (nextUser) {
      await AsyncStorage.setItem("user", JSON.stringify(nextUser));
    }
  }, []);

  const planEnabledModuleIds = useMemo(
    () => getEnabledModuleIdsFromPlan(evaluationPlan),
    [evaluationPlan],
  );

  const contextValue = useMemo(
    () => ({
      user,
      handleUser,
      register,
      login,
      logout,
      loading,
      userClients,
      clientsLoading,
      clientsError,
      refreshClients,
      currentClient,
      selectClient,
      evaluationPlan,
      evaluationPlanLoading,
      planEnabledModuleIds,
      reloadEvaluationPlan: loadEvaluationPlan,
    }),
    [
      user,
      handleUser,
      register,
      login,
      logout,
      loading,
      userClients,
      clientsLoading,
      clientsError,
      refreshClients,
      currentClient,
      selectClient,
      evaluationPlan,
      evaluationPlanLoading,
      planEnabledModuleIds,
      loadEvaluationPlan,
    ],
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
};

