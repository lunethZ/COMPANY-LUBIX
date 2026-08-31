import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useNavigation, type CompositeNavigationProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../context/ThemeContext";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { UserTopBar } from "../components/UserTopBar";
import { formatCOP } from "../utils/format";
import { COSTO_ENVIO, ENVIO_GRATIS_MIN } from "../constants/shop";
import type { MainTabParamList, RootStackParamList } from "../navigation/types";

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, "Carrito">,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function CarritoScreen() {
  const navigation = useNavigation<Nav>();
  const { C } = useTheme();
  const { items, subtotal, totalItems, loading, increment, decrement, removeItem, error } = useCart();
  const { isAuthenticated } = useAuth();

  const shipping = subtotal === 0 || subtotal >= ENVIO_GRATIS_MIN ? 0 : COSTO_ENVIO;
  const missingForFree = ENVIO_GRATIS_MIN - subtotal;

  const goCheckout = () => {
    if (!isAuthenticated) {
      navigation.navigate("Login");
      return;
    }
    navigation.navigate("Checkout", undefined);
  };

  if (loading && items.length === 0) {
    return (
      <View style={[styles.screen, styles.center, { backgroundColor: C.bg }]}>
        <ActivityIndicator size="large" color={C.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: C.bg }]}>
      <UserTopBar />

      <Text style={[styles.title, { color: C.text }]}>Carrito de Compras</Text>

      {items.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="cart-outline" size={44} color={C.muted} />
          <Text style={[styles.emptyTitle, { color: C.text }]}>
            Tu carrito está vacío
          </Text>
          <Text style={[styles.emptySub, { color: C.muted }]}>
            Agrega productos y vuelve aquí para finalizar tu compra.
          </Text>
          <TouchableOpacity
            style={[styles.emptyBtn, { backgroundColor: C.emerald }]}
            onPress={() => navigation.navigate("Inicio")}
          >
            <Text style={styles.emptyBtnText}>Explorar productos</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(item) => item.product_id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
            ListHeaderComponent={
              error ? (
                <Text style={[styles.error, { color: C.errorTextRed }]}>{error}</Text>
              ) : missingForFree > 0 ? (
                <View style={[styles.freeShipCard, { backgroundColor: C.successBg, borderColor: C.successBorder }]}>
                  <Text style={{ color: C.text, fontSize: 13 }}>
                    ¡Faltan <Text style={{ fontWeight: "800", color: C.successTextGreen }}>{formatCOP(missingForFree)}</Text>{" "}
                    para el envío gratis!
                  </Text>
                </View>
              ) : (
                <View style={[styles.freeShipCard, { backgroundColor: C.successBg, borderColor: C.successBorder }]}>
                  <Text style={{ color: C.successTextGreen, fontSize: 13, fontWeight: "700" }}>
                    ¡Tienes envío gratis!
                  </Text>
                </View>
              )
            }
            renderItem={({ item }) => (
              <View style={[styles.itemCard, { backgroundColor: C.bgCard, borderColor: C.border }]}>
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.itemImage} resizeMode="cover" />
                ) : (
                  <View style={[styles.itemImage, styles.imagePlaceholder, { backgroundColor: C.bgSecondary }]}>
                    <Ionicons name="bag" size={22} color={C.muted} />
                  </View>
                )}
                <View style={styles.itemInfo}>
                  <Text numberOfLines={2} style={[styles.itemName, { color: C.text }]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.itemPrice, { color: C.emerald }]}>
                    {formatCOP(item.unit_price)}
                  </Text>
                  <View style={styles.quantityRow}>
                    <View style={styles.stepper}>
                      <TouchableOpacity
                        style={[styles.qtyBtn, { borderColor: C.border }]}
                        onPress={() => decrement(item.product_id)}
                      >
                        <Text style={[styles.qtyBtnText, { color: C.text }]}>−</Text>
                      </TouchableOpacity>
                      <Text style={[styles.qty, { color: C.text }]}>{item.quantity}</Text>
                      <TouchableOpacity
                        style={[styles.qtyBtn, { borderColor: C.border }]}
                        onPress={() => increment(item.product_id)}
                      >
                        <Text style={[styles.qtyBtnText, { color: C.text }]}>+</Text>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity onPress={() => removeItem(item.product_id)}>
                      <Ionicons name="trash-outline" size={20} color={C.errorTextRed} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          />

          <View style={[styles.footer, { backgroundColor: C.bgCard, borderTopColor: C.border }]}>
            <View style={styles.summaryRow}>
              <Text style={{ color: C.textSecondary }}>Subtotal ({totalItems} {totalItems === 1 ? "artículo" : "artículos"})</Text>
              <Text style={{ color: C.text, fontWeight: "700" }}>{formatCOP(subtotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={{ color: C.textSecondary }}>Envío</Text>
              <Text style={{ color: C.text, fontWeight: "700" }}>
                {shipping === 0 ? "Gratis" : formatCOP(shipping)}
              </Text>
            </View>
            <View style={[styles.summaryRow, { marginTop: 6 }]}>
              <Text style={{ color: C.text, fontSize: 17, fontWeight: "800" }}>Total</Text>
              <Text style={{ color: C.emerald, fontSize: 20, fontWeight: "900" }}>
                {formatCOP(subtotal + shipping)}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.checkoutBtn, { backgroundColor: C.emerald }]}
              onPress={goCheckout}
            >
              <Text style={styles.checkoutText}>
                {isAuthenticated ? "Continuar compra" : "Inicia sesión para comprar"}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  title: {
    fontSize: 22,
    fontWeight: "800",
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 12,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyEmoji: { fontSize: 44, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "800" },
  emptySub: { fontSize: 13, marginTop: 6, textAlign: "center", paddingHorizontal: 24 },
  emptyBtn: { borderRadius: 12, paddingHorizontal: 22, paddingVertical: 12, marginTop: 18 },
  emptyBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  error: { marginBottom: 10, fontSize: 13 },
  freeShipCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
  },
  itemCard: {
    flexDirection: "row",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  itemImage: { width: 80, height: 80, borderRadius: 12 },
  imagePlaceholder: { alignItems: "center", justifyContent: "center" },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: "600", lineHeight: 19 },
  itemPrice: { fontSize: 14, fontWeight: "800", marginTop: 4 },
  quantityRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 10 },
  stepper: { flexDirection: "row", alignItems: "center", gap: 10 },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyBtnText: { fontSize: 16, fontWeight: "700" },
  qty: { fontSize: 14, fontWeight: "700", minWidth: 20, textAlign: "center" },
  remove: { fontSize: 16 },
  footer: {
    borderTopWidth: 1,
    padding: 16,
    gap: 6,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 14,
  },
  checkoutBtn: {
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 10,
  },
  checkoutText: { color: "#fff", fontWeight: "800", fontSize: 15 },
});