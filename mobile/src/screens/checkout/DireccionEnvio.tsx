import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../context/ThemeContext";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useCheckout } from "../../context/CheckoutContext";
import { getAddresses } from "../../api/user";
import CheckoutHeader from "../../components/CheckoutHeader";
import { Button } from "../../components/ui";
import type { Address } from "../../types/user";
import type { CheckoutStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<CheckoutStackParamList, "Direccion">;

export default function DireccionEnvioScreen() {
  const navigation = useNavigation<Nav>();
  const { C } = useTheme();
  const { address, setAddress } = useCheckout();

  const [saved, setSaved] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [manual, setManual] = useState(false);
  const [form, setForm] = useState({
    selected: "",
    label: "",
    address: "",
    city: "",
    department: "",
    postal_code: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    getAddresses()
      .then(setSaved)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const selectSaved = (item: Address) => {
    setManual(false);
    setAddress({
      label: item.label,
      address: item.address,
      city: item.city,
      department: item.department,
      postal_code: item.postal_code,
      is_default: item.is_default,
    });
    setForm({ ...form, selected: item.id });
  };

  const selectManualForm = () => {
    setManual(true);
    setAddress(null);
  };

  const isValid =
    manual
      ? form.address.trim().length > 0 && form.city.trim().length > 0
      : address !== null;

  const continueNext = () => {
    if (!isValid) {
      setError("Selecciona una dirección o completa el formulario.");
      return;
    }
    setError("");
    navigation.navigate("Pago");
  };

  return (
    <View style={[styles.screen, { backgroundColor: C.bg }]}>
      <CheckoutHeader step={1} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <Text style={[styles.title, { color: C.text }]}>Dirección de envío</Text>

        {loading ? (
          <ActivityIndicator color={C.accent} style={{ marginTop: 20 }} />
        ) : (
          <>
            {saved.length > 0 && !manual && (
              <>
                <Text style={[styles.subtitle, { color: C.textSecondary }]}>Tus direcciones guardadas</Text>
                {saved.map((item) => {
                  const active = form.selected === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.card,
                        {
                          backgroundColor: C.bgCard,
                          borderColor: active ? C.accent : C.border,
                          borderWidth: 2,
                        },
                      ]}
                      onPress={() => selectSaved(item)}
                    >
                      <View style={styles.cardRow}>
                        <Text style={[styles.cardLabel, { color: C.text }]}>
                          {item.label || "Dirección"}
                          {item.is_default ? " (por defecto)" : ""}
                        </Text>
                        {active && <Ionicons name="checkmark-circle" size={18} color={C.accent} />}
                      </View>
                      <Text style={{ color: C.textSecondary, fontSize: 13 }}>
                        {item.address}, {item.city}, {item.department}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}

            {!manual ? (
              <TouchableOpacity onPress={selectManualForm} style={{ marginTop: 6 }}>
                <Text style={{ color: C.accent, fontWeight: "700", fontSize: 14 }}>
                  + Usar otra dirección
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={[styles.card, styles.formCard, { backgroundColor: C.bgCard, borderColor: C.border }]}>
                <Text style={[styles.subtitle, { color: C.text }]}>Nueva dirección</Text>
                <CField label="Etiqueta (ej: Casa)" value={form.label} onChangeText={(v) => setForm({ ...form, label: v })} />
                <CField label="Dirección *" value={form.address} onChangeText={(v) => setForm({ ...form, address: v })} />
                <CField label="Ciudad *" value={form.city} onChangeText={(v) => setForm({ ...form, city: v })} />
                <CField label="Departamento" value={form.department} onChangeText={(v) => setForm({ ...form, department: v })} />
                <CField label="Código postal" value={form.postal_code} onChangeText={(v) => setForm({ ...form, postal_code: v })} />
                <TouchableOpacity onPress={selectSavedFromForm} style={{ marginTop: 8 }}>
                  <Text style={{ color: C.textSecondary, fontSize: 13 }}>← Volver a mis direcciones</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {error ? <Text style={{ color: C.errorText, marginTop: 12 }}>{error}</Text> : null}

        {(manual || address) && (
          <View style={[styles.preview, { backgroundColor: C.success, borderColor: C.successBorder }]}>
            <Text style={{ color: C.successText, fontSize: 13, fontWeight: "600" }}>
              {manual
                ? `A ${form.address}, ${form.city}${form.department ? `, ${form.department}` : ""}`
                : address
                ? `A ${address.address}, ${address.city}${address.department ? `, ${address.department}` : ""}`
                : ""}
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: C.bgCard, borderTopColor: C.border }]}>
        <Button title="Continuar con el pago" onPress={continueNext} />
      </View>
    </View>
  );

  function selectSavedFromForm() {
    setManual(false);
    if (form.selected) {
      const item = saved.find((s) => s.id === form.selected);
      if (item) setAddress({
        label: item.label,
        address: item.address,
        city: item.city,
        department: item.department,
        postal_code: item.postal_code,
        is_default: item.is_default,
      });
    }
  }
}

function CField({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
}) {
  const { C } = useTheme();
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ color: C.textSecondary, fontSize: 12, marginBottom: 5 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={label}
        placeholderTextColor={C.textSecondary}
        style={[styles.input, { backgroundColor: C.inputBg, borderColor: C.inputBorder, color: C.text }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  title: { fontSize: 19, fontWeight: "800", marginBottom: 14 },
  subtitle: { fontSize: 14, fontWeight: "700", marginBottom: 10 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  cardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardLabel: { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  formCard: { marginTop: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  preview: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginTop: 12,
  },
  footer: { borderTopWidth: 1, padding: 16 },
});