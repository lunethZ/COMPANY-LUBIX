export const resolveImage = (img?: string) => {
  if (!img || img === "/placeholder.png") return "/placeholder.png";
  if (img.startsWith("http://") || img.startsWith("https://")) return img;
  const base = (import.meta.env.VITE_API_URL || "http://localhost:8002").replace(/\/$/, "");
  const path = img.startsWith("/files") ? img : img.startsWith("/") ? `/files${img}` : `/files/${img}`;
  return `${base}${path.replace("/files/files", "/files")}`;
};
