import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useCart } from "../context/CartContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { RootStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface Props {
  role?: "user" | "empresa" | "admin" | "guest";
}

export default function AppHeader({ role = "guest" }: Props) {
  const navigation = useNavigation<Nav>();
  const { user, logout } = useAuth();
  const { C } = useTheme();
  const { totalItems } = useCart();
  const insets = useSafeAreaInsets();

  const handleLogout = async () => {
    await logout();
    navigation.reset({ index: 0, routes: [{ name: "Login" }] });
  };

  return (
    <View
      style={[
        styles.nav,
        {
          backgroundColor: C.navbar,
          borderBottomColor: C.border,
          paddingTop: Math.max(insets.top, 12) + 8,
        },
      ]}
    >
      <TouchableOpacity
        onPress={() => navigation.navigate("Main", { screen: "Inicio" })}
      >
        <Text style={styles.logo}>Lubix</Text>
      </TouchableOpacity>
      <View style={styles.actions}>
        {role === "user" && (
          <TouchableOpacity onPress={() => navigation.navigate("Main", { screen: "Carrito" })}>
            <Text style={[styles.link, { color: C.text }]}>Carrito {totalItems > 0 ? `(${totalItems})` : ""}</Text>
          </TouchableOpacity>
        )}
        {user && (
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user.name?.charAt(0).toUpperCase() || "U"}</Text>
            </View>
            <TouchableOpacity onPress={handleLogout}>
              <Text style={styles.logout}>Salir</Text>
            </TouchableOpacity>
          </View>
        )}
        {!user && (
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={[styles.link, { color: C.text }]}>Entrar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    paddingTop: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
  },
  logo: { color: "#22c55e", fontWeight: "800", fontSize: 20 },
  actions: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatarWrap: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#4ade80",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#000", fontWeight: "700" },
  link: { fontSize: 14, fontWeight: "600" },
  logout: { color: "#f87171", fontSize: 13, fontWeight: "600" },
});