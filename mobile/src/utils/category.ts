import type { ComponentProps } from "react";
import type Ionicons from "@expo/vector-icons/Ionicons";

export type CategoryGlyph = ComponentProps<typeof Ionicons>["name"];

const CATEGORY_ICON: Record<string, CategoryGlyph> = {
  audio: "headset",
  "cámaras": "camera",
  "camaras": "camera",
  cameras: "camera",
  wearables: "watch",
  gaming: "game-controller",
  celulares: "phone-portrait",
  smartphones: "phone-portrait",
  computadoras: "laptop",
  computers: "laptop",
  laptops: "laptop",
  accesorios: "keypad",
  televisores: "tv",
  tv: "tv",
};

export function categoryIcon(category: string | null | undefined): CategoryGlyph {
  if (!category) return "cube";
  const cleaned = category.trim().toLowerCase();
  if (CATEGORY_ICON[cleaned]) return CATEGORY_ICON[cleaned];
  if (/telefono|celular|smartphone|phone/i.test(cleaned)) return "phone-portrait";
  if (/computador|laptop|pc|portatil|notebook/i.test(cleaned)) return "laptop";
  if (/audio|audífono|audifono|parlante|speaker/i.test(cleaned)) return "headset";
  if (/camara|cámara|camera/i.test(cleaned)) return "camera";
  if (/watch|reloj|wearable/i.test(cleaned)) return "watch";
  if (/gaming|consola|videojuego/i.test(cleaned)) return "game-controller";
  if (/televisor|tv|pantalla/i.test(cleaned)) return "tv";
  return "cube";
}