import { API_BASE_URL } from "../api/config";

export const resolveImage = (img?: string) => {
  if (!img || img === "/placeholder.png") return "/placeholder.png";
  if (img.startsWith("http://") || img.startsWith("https://")) return img;
  const base = API_BASE_URL;
  const path = img.startsWith("/files") ? img : img.startsWith("/") ? `/files${img}` : `/files/${img}`;
  return `${base}${path.replace("/files/files", "/files")}`;
};
