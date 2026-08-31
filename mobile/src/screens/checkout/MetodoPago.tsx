import React, { useState } from "react";
import type { ComponentProps } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import type IoniconsType from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../context/ThemeContext";
import { useCheckout } from "../../context/CheckoutContext";
import CheckoutHeader from "../../components/CheckoutHeader";
import { Button } from "../../components/ui";
import { formatCOP } from "../../utils/format";
import { errorDetailMessage } from "../../utils/errors";
import type { PaymentMethod } from "../../types/order";
import type { CheckoutStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<CheckoutStackParamList, "Pago">;

type PayGlyph = ComponentProps<typeof IoniconsType>["name"];

const METHODS: Array<{ key: PaymentMethod; label: string; icon: PayGlyph }> = [
  { key: "tarjeta", label: "Tarjeta de crédito/débito", icon: "card" },
  { key: "pse", label: "PSE", icon: "business" },
  { key: "efectivo", label: "Contraentrega", icon: "cash" },
];

export default function MetodoPagoScreen() {
  const navigation = useNavigation<Nav>();
  const { C } = useTheme();
  const {
    paymentMethod,
    setPaymentMethod,
    address,
    total,
    submitting,
    submit,
  } = useCheckout();

  const [card, setCard] = useState({ number: "", holder: "", expiry: "", cvv: "" });
  const [bank, setBank] = useState("");
  const [error, setError] = useState("");

  const validate = (): string | null => {
    if (!address) return "Falta la dirección de envío.";
    if (paymentMethod === "tarjeta") {
      const digits = card.number.replace(/\s/g, "");
      if (digits.length < 12) return "Número de tarjeta inválido.";
      if (!card.holder.trim()) return "Ingresa el nombre del titular.";
      if (!/^\d{2}\/\d{2}$/.test(card.expiry)) return "Fecha de vencimiento inválida (MM/AA).";
      if (card.cvv.trim().length < 3) return "CVV inválido.";
    }
    if (paymentMethod === "pse" && !bank.trim()) return "Selecciona tu entidad bancaria.";
    return null;
  };

  const pay = async () => {
    if (submitting) return;
    const validation = validate();
    if (validation) {
      setError(validation);
      return;
    }
    setError("");
    try {
      const orderId = await submit();
      navigation.replace("Confirmacion", { orderId });
    } catch (e: unknown) {
      const isMissingAddress =
        e instanceof Error && e.message === "Falta la dirección de envío";
      const msg = isMissingAddress
        ? ""
        : errorDetailMessage(e, "");
      setError(msg || "No se pudo procesar el pago. Intenta de nuevo.");
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: C.bg }]}>
      <CheckoutHeader step={2} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <Text style={[styles.title, { color: C.text }]}>Método de pago</Text>

        {METHODS.map((method) => {
          const active = paymentMethod === method.key;
          return (
            <TouchableOpacity
              key={method.key}
              style={[
                styles.methodCard,
                { backgroundColor: C.bgCard, borderColor: active ? C.accent : C.border, borderWidth: 2 },
              ]}
              onPress={() => setPaymentMethod(method.key)}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={[styles.radio, { borderColor: active ? C.accent : C.border }]}>
                  {active && <View style={[styles.radioInner, { backgroundColor: C.accent }]} />}
                </View>
                <Ionicons name={method.icon} size={20} color={active ? C.accent : C.textSecondary} />
                <Text style={{ color: C.text, fontWeight: "700", fontSize: 14 }}>{method.label}</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {paymentMethod === "tarjeta" && (
          <View style={[styles.formCard, { backgroundColor: C.bgCard, borderColor: C.border }]}>
            <Text style={[styles.subtitle, { color: C.text }]}>Datos de la tarjeta</Text>
            <CardField
              label="Número de tarjeta"
              value={card.number}
              onChangeText={(v) => setCard({ ...card, number: v.replace(/[^\d ]/g, "") })}
              placeholder="1234 5678 9012 3456"
              keyboardType="number-pad"
            />
            <CardField label="Titular" value={card.holder} onChangeText={(v) => setCard({ ...card, holder: v })} placeholder="Nombre como aparece en la tarjeta" />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <CardField label="Vencimiento" value={card.expiry} onChangeText={(v) => setCard({ ...card, expiry: v })} placeholder="MM/AA" keyboardType="number-pad" />
              </View>
              <View style={{ flex: 1 }}>
                <CardField label="CVV" value={card.cvv} onChangeText={(v) => setCard({ ...card, cvv: v.replace(/[^\d]/g, "") })} placeholder="123" keyboardType="number-pad" secureTextEntry />
              </View>
            </View>
            <Text style={{ color: C.textSecondary, fontSize: 11, marginTop: 8 }}>
              Pago simulado: ningún cobro real se realizará en esta demo.
            </Text>
          </View>
        )}

        {paymentMethod === "pse" && (
          <View style={[styles.formCard, { backgroundColor: C.bgCard, borderColor: C.border }]}>
            <Text style={[styles.subtitle, { color: C.text }]}>Entidad bancaria</Text>
            <CardField label="Banco" value={bank} onChangeText={setBank} placeholder="Ej: Bancolombia, Davivienda..." />
            <Text style={{ color: C.textSecondary, fontSize: 11, marginTop: 8 }}>
              Pago simulado por PSE.
            </Text>
          </View>
        )}

        {paymentMethod === "efectivo" && (
          <View style={[styles.formCard, { backgroundColor: C.success, borderColor: C.successBorder }]}>
            <Text style={{ color: C.successText, fontSize: 13, fontWeight: "600" }}>
              Pagarás en efectivo cuando el pedido llegue a tu puerta.
            </Text>
          </View>
        )}

        {error ? <Text style={{ color: C.errorText, marginTop: 12 }}>{error}</Text> : null}

        <View style={[styles.summary, { backgroundColor: C.bgCard, borderColor: C.border }]}>
          <View style={styles.sumRow}>
            <Text style={{ color: C.textSecondary }}>A: {address?.address}, {address?.city}</Text>
          </View>
          <View style={[styles.sumRow, styles.grand]}>
            <Text style={{ color: C.text, fontSize: 16, fontWeight: "800" }}>Total a pagar</Text>
            <Text style={{ color: C.accent, fontSize: 20, fontWeight: "900" }}>{formatCOP(total)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: C.bgCard, borderTopColor: C.border }]}>
        <Button
          title={submitting ? "Procesando pago..." : "Confirmar y pagar"}
          onPress={pay}
          loading={submitting}
        />
      </View>
    </View>
  );
}

function CardField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  secureTextEntry,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: "number-pad" | "default";
  secureTextEntry?: boolean;
}) {
  const { C } = useTheme();
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ color: C.textSecondary, fontSize: 12, marginBottom: 5 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.textSecondary}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        style={[styles.input, { backgroundColor: C.inputBg, borderColor: C.inputBorder, color: C.text }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  title: { fontSize: 19, fontWeight: "800", marginBottom: 14 },
  subtitle: { fontSize: 14, fontWeight: "700", marginBottom: 12 },
  methodCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
  formCard: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  summary: { borderRadius: 14, borderWidth: 1, padding: 16, marginTop: 12, gap: 8 },
  sumRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  grand: { borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.08)", paddingTop: 10 },
  footer: { borderTopWidth: 1, padding: 16 },
});