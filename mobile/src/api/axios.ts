import axios from "axios";
import { secureStore } from "../store/secureStore";
import { emitAuthExpired } from "../utils/authEvents";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:8001";

const api = axios.create({
  baseURL: API_URL,
  timeout: 20000,
});

api.interceptors.request.use(async (config) => {
  const accessToken = await secureStore.getItem("access_token");
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const url = originalRequest?.url || "";

    if (url.includes("/auth/refresh")) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = await secureStore.getItem("refresh_token");

      if (refreshToken && refreshToken.split(".").length === 3) {
        try {
          const res = await api.post("/auth/refresh", {
            old_refresh_token: refreshToken,
          });

          const newAccessToken = res.data.access_token;
          const newRefreshToken = res.data.refresh_token;

          await secureStore.setItem("access_token", newAccessToken);
          await secureStore.setItem("refresh_token", newRefreshToken);
          api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;

          return api(originalRequest);
        } catch {
          await secureStore.removeItem("access_token");
          await secureStore.removeItem("refresh_token");
          await secureStore.removeItem("user");
          emitAuthExpired();
        }
      } else {
        await secureStore.removeItem("access_token");
        await secureStore.removeItem("refresh_token");
        await secureStore.removeItem("user");
        emitAuthExpired();
      }
    }

    return Promise.reject(error);
  }
);

export default api;