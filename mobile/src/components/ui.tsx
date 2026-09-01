import { ReactNode } from "react";
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";

export function Screen({
  children,
  scroll,
  style,
}: {
  children: ReactNode;
  scroll?: boolean;
  style?: object;
}) {
  const { C } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: C.bg, paddingBottom: insets.bottom },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function ScreenScroll({
  children,
  style,
}: {
  children: ReactNode;
  style?: object;
}) {
  const { C } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: C.bg, paddingBottom: insets.bottom },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: object }) {
  const { C } = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: C.bgCard,
          borderColor: C.border,
          shadowColor: C.shadow,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

interface FieldProps extends TextInputProps {
  label?: string;
}

export function Field({ label, style, ...props }: FieldProps) {
  const { C } = useTheme();
  return (
    <View style={styles.field}>
      {label ? (
        <Text style={[styles.label, { color: C.textSecondary }]}>
          {label}
        </Text>
      ) : null}
      <TextInput
        placeholderTextColor={C.textSecondary}
        {...props}
        style={[
          styles.input,
          { backgroundColor: C.inputBg, borderColor: C.inputBorder, color: C.text },
          style,
        ]}
      />
    </View>
  );
}

interface BtnProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost";
  style?: object;
}

export function Button({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = "primary",
  style,
}: BtnProps) {
  const { C } = useTheme();
const backgroundColor =
    variant === "primary"
      ? C.btnPrimary
      : variant === "secondary"
      ? C.btnSecondary
      : "transparent";
  const color = variant === "ghost" ? C.accent : "#ffffff";
  const dimmedBg =
    variant === "primary" ? C.btnPrimaryHover : backgroundColor;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={disabled || loading}
      onPress={onPress}
      style={[
        styles.btn,
        {
          backgroundColor: disabled || loading ? dimmedBg : backgroundColor,
          borderWidth: variant === "ghost" ? 1 : 0,
          borderColor: variant === "ghost" ? C.accent : "transparent",
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#ffffff" />
      ) : (
        <Text style={[styles.btnText, { color: variant === "secondary" ? C.text : color }]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

interface PopupProps {
  message: string;
  type: "success" | "error";
}

export function Popup({ message, type }: PopupProps) {
  const { C } = useTheme();
  const colors =
    type === "success"
      ? { bg: C.success, border: C.successBorder, text: C.successText }
      : { bg: C.error, border: C.errorBorder, text: C.errorText };

  return (
    <View style={[styles.popup, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <Text style={[styles.popupText, { color: colors.text }]}>{message}</Text>
    </View>
  );
}

export function StrengthBar({ strength }: { strength: number }) {
  const colorsBar = ["#ef4444", "#f97316", "#eab308", "#22c55e"];
  const { C } = useTheme();
  return (
    <View style={[styles.strengthTrack, { backgroundColor: C.border }]}>
      <View
        style={{
          width: `${(strength / 4) * 100}%`,
          height: 8,
          borderRadius: 999,
          backgroundColor: colorsBar[Math.max(0, strength - 1)] || colorsBar[3],
        }}
      />
    </View>
  );
}

export function Stars({
  value,
  size = 16,
  style,
}: {
  value: number;
  size?: number;
  style?: object;
}) {
  const { C } = useTheme();
  return (
    <View style={[styles.starsRow, style]}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= Math.round(value) ? "star" : "star-outline"}
          size={size}
          color={i <= Math.round(value) ? C.starFill : C.starEmpty}
        />
      ))}
    </View>
  );
}

export function StarRatingEditable({
  value,
  size = 26,
  onChange,
}: {
  value: number;
  size?: number;
  onChange: (v: number) => void;
}) {
  const { C } = useTheme();
  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((i) => (
        <TouchableOpacity key={i} onPress={() => onChange(i)}>
          <Ionicons
            name={i <= value ? "star" : "star-outline"}
            size={size}
            color={i <= value ? C.starFill : C.starEmpty}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  card: {
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  field: { marginBottom: 14 },
  label: { fontSize: 13, marginBottom: 6, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  btn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  btnText: { fontSize: 16, fontWeight: "700" },
  popup: {
    position: "absolute",
    top: 50,
    left: 16,
    right: 16,
    zIndex: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  popupText: { fontSize: 14, fontWeight: "600" },
  starsRow: { flexDirection: "row", alignItems: "center", gap: 1 },
  strengthTrack: {
    height: 8,
    borderRadius: 999,
    overflow: "hidden",
  },
});