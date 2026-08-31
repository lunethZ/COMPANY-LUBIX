import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../context/ThemeContext";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useCheckout } from "../../context/CheckoutContext";
import { useCart } from "../../context/CartContext";
import { formatCOP } from "../../utils/format";
import type { CheckoutStackParamList, RootStackParamList } from "../../navigation/types";

type Route = RouteProp<CheckoutStackParamList, "Confirmacion">;
type RootNav = NativeStackNavigationProp<RootStackParamList>;

export default function ConfirmacionOrdenScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<RootNav>();
  const { C } = useTheme();
  const { total } = useCheckout();
  const { totalItems } = useCart();
  const orderId = route.params.orderId;

  const goTo = (screen: "Perfil" | "Inicio") => () =>
    navigation.reset({
      index: 0,
      routes: [
        {
          name: "Main",
          params: screen === "Perfil" ? { screen: "Perfil" } : { screen: "Inicio" },
        },
      ],
    });

  return (
    <View style={[styles.screen, { backgroundColor: C.bg }]}>
      <View style={styles.center}>
        <View style={[styles.check, { backgroundColor: C.success }]}>
          <Ionicons name="checkmark" size={40} color="#fff" />
        </View>
        <Text style={[styles.title, { color: C.text }]}>¡Pedido confirmado!</Text>
        <Text style={[styles.desc, { color: C.textSecondary }]}>
          Gracias por tu compra. Recibirás tu pedido en la dirección indicada.
        </Text>

        <View style={[styles.summary, { backgroundColor: C.bgCard, borderColor: C.border }]}>
          <View style={styles.sumRow}>
            <Text style={{ color: C.textSecondary }}>Número de pedido</Text>
            <Text style={[styles.orderId, { color: C.accent }]}>{orderId.slice(0, 12).toUpperCase()}</Text>
          </View>
          <View style={styles.sumRow}>
            <Text style={{ color: C.textSecondary }}>Artículos</Text>
            <Text style={{ color: C.text, fontWeight: "700" }}>{totalItems}</Text>
          </View>
          <View style={[styles.sumRow, { borderTopWidth: 1, borderTopColor: C.border, paddingTop: 10 }]}>
            <Text style={{ color: C.text, fontSize: 16, fontWeight: "800" }}>Total</Text>
            <Text style={{ color: C.accent, fontSize: 19, fontWeight: "900" }}>{formatCOP(total)}</Text>
          </View>
        </View>

        <Text style={[styles.trackingHint, { color: C.textSecondary }]}>
          Puedes seguir el estado de tu pedido en tu perfil, sección "Mis pedidos".
        </Text>
      </View>

      <View style={[styles.footer, { backgroundColor: C.bgCard, borderTopColor: C.border }]}>
        <TouchableOpacity style={[styles.btn, { backgroundColor: C.btnPrimary }]} onPress={goTo("Perfil")}>
          <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>Ir a mis pedidos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnSecondary} onPress={goTo("Inicio")}>
          <Text style={{ color: C.accent, fontWeight: "700" }}>Seguir comprando</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28 },
  check: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  checkIcon: { color: "#fff", fontSize: 36, fontWeight: "900" },
  title: { fontSize: 22, fontWeight: "900", marginBottom: 8 },
  desc: { fontSize: 14, textAlign: "center", lineHeight: 21, marginBottom: 24 },
  summary: { width: "100%", borderRadius: 14, borderWidth: 1, padding: 16, gap: 8 },
  sumRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderId: { fontSize: 13, fontWeight: "800" },
  trackingHint: { fontSize: 12, textAlign: "center", marginTop: 18, lineHeight: 18 },
  footer: { borderTopWidth: 1, padding: 16, gap: 10 },
  btn: { borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  btnSecondary: { paddingVertical: 10, alignItems: "center" },
});