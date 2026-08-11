import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "https://kinapp-api.vercel.app/";

if (__DEV__) {
  console.log("[Kinecat] API:", API_BASE_URL);
}

const PUBLIC_AUTH_PATHS = ["/sign-in", "/sign-up", "/forgot-password", "/reset-password"];

const isPublicAuthRequest = (url = "") =>
  PUBLIC_AUTH_PATHS.some((path) => url.includes(path));

const getStoredAuthToken = async () => {
  try {
    const storedUser = await AsyncStorage.getItem("user");
    if (!storedUser) return null;

    const user = JSON.parse(storedUser);
    return user?.token || null;
  } catch {
    return null;
  }
};

export const clearStoredSession = async () => {
  await AsyncStorage.removeItem("user");
};

export const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

client.interceptors.request.use(
  async (config) => {
    const token = await getStoredAuthToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || "";

    if (status === 401 && !isPublicAuthRequest(requestUrl)) {
      await clearStoredSession();
    }

    return Promise.reject(error);
  },
);

export default client;
