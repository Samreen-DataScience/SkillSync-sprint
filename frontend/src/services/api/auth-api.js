import axios from "axios";
import { useAuthStore } from "@/store/auth-store";
import { apiClient } from "./client";

const AUTH_SERVICE_URL = import.meta.env.VITE_AUTH_SERVICE_URL ?? "http://localhost:9001";

const directAuthClient = axios.create({
  baseURL: AUTH_SERVICE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

const shouldUseDirectAuth = (error) => {
  const status = error?.response?.status;
  return status === 404 || status === 405 || status === 500 || status === 503 || error?.code === "ERR_NETWORK";
};

const withGatewayFallback = async (gatewayRequest, directRequest) => {
  try {
    return await gatewayRequest();
  } catch (error) {
    if (!shouldUseDirectAuth(error)) throw error;
    return directRequest(error);
  }
};

const authHeaders = () => {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const authApi = {
  login: async (payload) => {
    const { data } = await directAuthClient.post("/auth/login", payload);
    return data;
  },
  register: async (payload) => {
    const { data } = await directAuthClient.post("/auth/register", payload);
    return data;
  },
  changePassword: async (payload) => {
    return withGatewayFallback(
      async () => {
        const { data } = await apiClient.put("/auth/password", payload);
        return data;
      },
      async () => {
        const { data } = await directAuthClient.put("/auth/password", payload, { headers: authHeaders() });
        return data;
      },
    );
  },
};
