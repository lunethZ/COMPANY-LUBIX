import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
} from "react-native";
import { useNavigation, type CompositeNavigationProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../context/ThemeContext";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useCheckout } from "../../context/CheckoutContext";
import CheckoutHeader from "../../components/CheckoutHeader";
import { Button } from "../../components/ui";
import { formatCOP } from "../../utils/format";
import type { CheckoutStackParamList, RootStackParamList } from "../../navigation/types";

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<CheckoutStackParamList, "Resumen">,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function ResumenOrdenScreen() {
  const navigation = useNavigation<Nav>();
  const { C } = useTheme();
  const { user } = useAuth();
  const { items } = useCart();
  const { recipient, setRecipient, promo, setPromo, promoApplied, discount, shipping, total } =
    useCheckout();
  const [showPromo, setShowPromo] = useState(false);

  if (items.length === 0) {
    return (
      <View style={[styles.screen, styles.center, { backgroundColor: C.bg }]}>
        <Text style={{ color: C.textSecondary }}>Tu carrito está vacío.</Text>
        <TouchableOpacity
          style={styles.goShop}
          onPress={() => navigation.navigate("Main", { screen: "Inicio" } as never)}
        >
          <Text style={{ color: C.accent, fontWeight: "700" }}>Ir a comprar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: C.bg }]}>
      <CheckoutHeader step={0} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <Text style={[styles.sectionTitle, { color: C.text }]}>Resumen de tu pedido</Text>

        <View style={[styles.cartCard, { backgroundColor: C.bgCard, borderColor: C.border }]}>
          {items.map((item) => (
            <View key={item.product_id} style={[styles.itemRow, { borderBottomColor: C.border }]}>
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.itemImage} resizeMode="cover" />
              ) : (
                <View style={[styles.itemImage, styles.ph, { backgroundColor: C.bgSecondary }]}>
                  <Ionicons name="bag" size={16} color={C.muted} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text numberOfLines={2} style={{ color: C.text, fontWeight: "600", fontSize: 13 }}>
                  {item.name}
                </Text>
                <Text style={{ color: C.textSecondary, fontSize: 12, marginTop: 2 }}>
                  x{item.quantity}
                </Text>
              </View>
              <Text style={{ color: C.text, fontWeight: "700", fontSize: 13 }}>
                {formatCOP(item.line_total)}
              </Text>
            </View>
          ))}
        </View>

        <Text style={[styles.fieldLabel, { color: C.textSecondary }]}>Nombre del destinatario</Text>
        <TextInput
          value={recipient}
          onChangeText={setRecipient}
          placeholder={user?.name || "Nombre y apellido"}
          placeholderTextColor={C.textSecondary}
          style={[
            styles.input,
            { backgroundColor: C.inputBg, borderColor: C.inputBorder, color: C.text },
          ]}
        />

        <TouchableOpacity onPress={() => setShowPromo((v) => !v)} style={{ marginTop: 6 }}>
          <Text style={{ color: C.accent, fontWeight: "600", fontSize: 13 }}>
            {showPromo ? "Ocultar cupón" : "¿Tienes un cupón? Aplícalo aquí"}
          </Text>
        </TouchableOpacity>

        {showPromo && (
          <View style={styles.promoRow}>
            <TextInput
              value={promo}
              onChangeText={setPromo}
              placeholder="Ej: LUBIX10"
              placeholderTextColor={C.textSecondary}
              autoCapitalize="characters"
              style={[
                styles.input,
                styles.promoInput,
                { backgroundColor: C.inputBg, borderColor: C.inputBorder, color: C.text },
              ]}
            />
            {promoApplied && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Ionicons name="checkmark-circle" size={15} color={C.accent} />
                <Text style={{ color: C.accent, fontWeight: "700", fontSize: 13 }}>Aplicado</Text>
              </View>
            )}
          </View>
        )}

        <View style={[styles.totals, { backgroundColor: C.bgCard, borderColor: C.border }]}>
          <View style={styles.totalRow}>
            <Text style={{ color: C.textSecondary }}>Subtotal</Text>
            <Text style={{ color: C.text, fontWeight: "700" }}>{formatCOP(items.reduce((a, i) => a + i.line_total, 0))}</Text>
          </View>
          {promoApplied && (
            <View style={styles.totalRow}>
              <Text style={{ color: "#f59e0b" }}>Descuento (LUBIX10)</Text>
              <Text style={{ color: "#f59e0b", fontWeight: "700" }}>-{formatCOP(discount)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={{ color: C.textSecondary }}>Envío</Text>
            <Text style={{ color: C.text, fontWeight: "700" }}>
              {shipping === 0 ? "Gratis" : formatCOP(shipping)}
            </Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text style={{ color: C.text, fontSize: 17, fontWeight: "800" }}>Total</Text>
            <Text style={{ color: C.accent, fontSize: 20, fontWeight: "900" }}>{formatCOP(total)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: C.bgCard, borderTopColor: C.border }]}>
        <Button title="Continuar con el envío" onPress={() => navigation.navigate("Direccion")} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  goShop: { marginTop: 16 },
  sectionTitle: { fontSize: 17, fontWeight: "800", marginBottom: 12 },
  cartCard: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, marginBottom: 16 },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  itemImage: { width: 48, height: 48, borderRadius: 8 },
  ph: { alignItems: "center", justifyContent: "center" },
  fieldLabel: { fontSize: 12, fontWeight: "600", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  promoRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 },
  promoInput: { flex: 1 },
  totals: { borderRadius: 14, borderWidth: 1, padding: 16, marginTop: 16, gap: 8 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  grandTotal: { borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.08)", paddingTop: 10, marginTop: 4 },
  footer: { borderTopWidth: 1, padding: 16 },
});