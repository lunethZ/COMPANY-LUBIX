import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors } from "../constants/colors";

export type ThemeType = "light" | "dark";

export interface ThemeColors {
  bg: string;
  bgSecondary: string;
  bgCard: string;
  text: string;
  textSecondary: string;
  navbar: string;
  navbarBorder: string;
  btnPrimary: string;
  btnPrimaryHover: string;
  btnSecondary: string;
  accent: string;
  accentLight: string;
  accentDark: string;
  success: string;
  successText: string;
  successBorder: string;
  error: string;
  errorText: string;
  errorBorder: string;
  border: string;
  shadow: string;
  inputBg: string;
  inputBorder: string;
  cardShadow: string;
  navy: string;
  navyInput: string;
  emerald: string;
  emeraldDark: string;
  yellow: string;
  pink: string;
  star: string;
  starFill: string;
  starEmpty: string;
  muted: string;
  successBg: string;
  successTextGreen: string;
  errorBg: string;
  errorTextRed: string;
}

interface ThemeContextType {
  theme: ThemeType;
  toggleTheme: () => void;
  C: ThemeColors;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme debe usarse dentro de ThemeProvider");
  }
  return context;
};

const STORAGE_KEY = "theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [theme, setTheme] = useState<ThemeType>("light");

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === "light" || saved === "dark") {
          setTheme(saved);
        } else {
          setTheme(systemScheme === "dark" ? "dark" : "light");
        }
      } catch {
        setTheme(systemScheme === "dark" ? "dark" : "light");
      }
    })();
  }, [systemScheme]);

  const toggleTheme = useCallback(async () => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  const C = colors[theme];

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, C }}>
      {children}
    </ThemeContext.Provider>
  );
}