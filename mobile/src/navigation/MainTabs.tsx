import React from "react";
import { StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "@expo/vector-icons/Ionicons";
import type { ComponentProps } from "react";
import { useTheme } from "../context/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCart } from "../context/CartContext";
import HomeUsuarioScreen from "../screens/HomeUsuario";
import BuscarProductoScreen from "../screens/BuscarProducto";
import CategoriasScreen from "../screens/Categorias";
import CarritoScreen from "../screens/Carrito";
import PerfilScreen from "../screens/PerfilScreen";
import type { MainTabParamList } from "./types";

const Tab = createBottomTabNavigator<MainTabParamList>();

type Glyph = ComponentProps<typeof Ionicons>["name"];

const ICONS: Record<keyof MainTabParamList, { active: Glyph; inactive: Glyph }> = {
  Inicio: { active: "home", inactive: "home-outline" },
  Buscar: { active: "search", inactive: "search-outline" },
  Categorias: { active: "grid", inactive: "grid-outline" },
  Carrito: { active: "cart", inactive: "cart-outline" },
  Perfil: { active: "person", inactive: "person-outline" },
};

export default function MainTabs() {
  const { C } = useTheme();
  const insets = useSafeAreaInsets();
  const { totalItems } = useCart();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const icons = ICONS[route.name as keyof MainTabParamList];
        return {
          headerShown: false,
          tabBarActiveTintColor: C.accent,
          tabBarInactiveTintColor: C.textSecondary,
          tabBarStyle: {
            backgroundColor: C.navbar,
            borderTopColor: C.border,
            height: 60 + insets.bottom,
            paddingBottom: insets.bottom,
          },
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? icons.active : icons.inactive}
              size={22}
              color={color}
            />
          ),
        };
      }}
    >
      <Tab.Screen name="Inicio" component={HomeUsuarioScreen} />
      <Tab.Screen name="Buscar" component={BuscarProductoScreen} />
      <Tab.Screen name="Categorias" component={CategoriasScreen} />
      <Tab.Screen
        name="Carrito"
        component={CarritoScreen}
        options={{
          tabBarBadge: totalItems > 0 ? totalItems : undefined,
          tabBarBadgeStyle: styles.badge,
        }}
      />
      <Tab.Screen name="Perfil" component={PerfilScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: "#22c55e",
    fontSize: 11,
  },
});