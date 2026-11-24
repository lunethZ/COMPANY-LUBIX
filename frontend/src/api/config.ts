const PRODUCTION_API_URL = "https://lubix-api.onrender.com";

const fallbackApiUrl = import.meta.env.PROD
  ? PRODUCTION_API_URL
  : "http://localhost:8002";

const configuredApiUrl = (import.meta.env.VITE_API_URL || "").trim();

export const API_BASE_URL: string = (configuredApiUrl || fallbackApiUrl).replace(/\/+$/, "");

// Render Free duerme el servicio y el primer request tarda cerca de un minuto.
export const API_TIMEOUT_MS = 65_000;
