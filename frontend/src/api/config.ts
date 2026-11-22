const fallbackApiUrl = import.meta.env.PROD
  ? "https://lubix-api.onrender.com"
  : "http://localhost:8002";

export const API_BASE_URL: string = (
  import.meta.env.VITE_API_URL || fallbackApiUrl
).replace(/\/$/, "");
