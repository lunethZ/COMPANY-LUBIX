import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  TextInput,
} from "react-native";
import { useNavigation, type CompositeNavigationProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../context/ThemeContext";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuth } from "../context/AuthContext";
import {
  getDashboardMe,
  getOrders,
  getAddresses,
  getFavorites,
  createAddress,
  cancelOrder,
} from "../api/user";
import { formatCOP, formatDate } from "../utils/format";
import { STATUS_LABELS } from "../types/order";
import type { DashboardMe, Address, FavoriteItem } from "../types/user";
import type { Order } from "../types/order";
import type { MainTabParamList, RootStackParamList } from "../navigation/types";

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, "Perfil">,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function PerfilScreen() {
  const navigation = useNavigation<Nav>();
  const { C, theme, toggleTheme } = useTheme();
  const { user, logout, updateUser } = useAuth();

  const [me, setMe] = useState<DashboardMe | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addr, setAddr] = useState({
    label: "",
    address: "",
    city: "",
    department: "",
    postal_code: "",
    is_default: false,
  });
  const [savingAddress, setSavingAddress] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    try {
      const [m, o, a, f] = await Promise.all([
        getDashboardMe(),
        getOrders(),
        getAddresses(),
        getFavorites(),
      ]);
      setMe(m);
      setOrders(o);
      setAddresses(a);
      setFavorites(f);
      if (m?.fullName && m.fullName !== user?.name) {
        await updateUser({ name: m.fullName });
      }
    } catch {
      // backend unavailable
    }
  }, [updateUser, user?.name]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddAddress = async () => {
    if (!addr.address.trim() || !addr.city.trim()) {
      setMessage("Completa dirección y ciudad.");
      return;
    }
    setSavingAddress(true);
    try {
      await createAddress({
        label: addr.label || undefined,
        address: addr.address,
        city: addr.city,
        department: addr.department,
        postal_code: addr.postal_code || undefined,
        is_default: addr.is_default,
      });
      setShowAddressForm(false);
      setAddr({ label: "", address: "", city: "", department: "", postal_code: "", is_default: false });
      setMessage("Dirección guardada.");
      await load();
    } catch {
      setMessage("No se pudo guardar la dirección");
    } finally {
      setSavingAddress(false);
    }
  };

  const handleCancelOrder = async (id: string) => {
    try {
      await cancelOrder(id);
      await load();
    } catch {
      // ignore
    }
  };

  const handleLogout = async () => {
    await logout();
    (navigation as unknown as NativeStackNavigationProp<RootStackParamList>).reset({
      index: 0,
      routes: [{ name: "Login" }],
    });
  };

  if (loading) {
    return (
      <View style={[styles.screen, styles.center, { backgroundColor: C.bg }]}>
        <ActivityIndicator size="large" color={C.accent} />
      </View>
    );
  }

  const stats = [
    { label: "Pedidos", value: me?.totalOrders ?? orders.length },
    { label: "Direcciones", value: me?.addresses ?? addresses.length },
    { label: "Favoritos", value: me?.savedProducts ?? favorites.length },
  ];

  return (
    <View style={[styles.screen, { backgroundColor: C.bg }]}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        ListHeaderComponent={
          <View style={{ paddingTop: 46 }}>
            <View style={[styles.profileCard, { backgroundColor: C.bgCard, borderColor: C.border }]}>
              <View style={[styles.avatar, { backgroundColor: C.accentLight }]}>
                <Text style={styles.avatarText}>
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: C.text }]}>{user?.name || "Usuario"}</Text>
                <Text style={[styles.profileEmail, { color: C.textSecondary }]}>{user?.email}</Text>
                {me ? (
                  <Text style={[styles.memberSince, { color: C.textSecondary }]}>
                    Miembro desde {formatDate(me.memberSince)}
                  </Text>
                ) : null}
              </View>
              <TouchableOpacity onPress={toggleTheme} style={styles.themeBtn}>
                <Ionicons name={theme === "dark" ? "sunny" : "moon"} size={20} color={C.accent} />
              </TouchableOpacity>
            </View>

            <View style={styles.statsRow}>
              {stats.map((stat) => (
                <View key={stat.label} style={[styles.statCard, { backgroundColor: C.bgCard, borderColor: C.border }]}>
                  <Text style={[styles.statValue, { color: C.accent }]}>{stat.value}</Text>
                  <Text style={[styles.statLabel, { color: C.textSecondary }]}>{stat.label}</Text>
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: C.text }]}>Mis pedidos</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={[styles.section, { alignItems: "center", paddingVertical: 12 }]}>
            <Text style={{ color: C.textSecondary }}>Aún no tienes pedidos.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.orderCard, { backgroundColor: C.bgCard, borderColor: C.border }]}>
            <View style={styles.orderHeader}>
              <Text style={[styles.orderId, { color: C.text }]}>
                Pedido {item.id.slice(0, 8).toUpperCase()}
              </Text>
              <Text style={[styles.orderStatus, { color: C.accent }]}>
                {STATUS_LABELS[item.status] || item.status}
              </Text>
            </View>
            <Text style={{ color: C.textSecondary, fontSize: 12 }}>
              {formatDate(item.created_at)} · {item.payment_method}
            </Text>
            <Text style={[styles.orderTotal, { color: C.accent }]}>{formatCOP(item.total)}</Text>
            {item.status === "pending" && (
              <TouchableOpacity onPress={() => handleCancelOrder(item.id)}>
                <Text style={{ color: C.errorText, fontSize: 13, fontWeight: "600" }}>Cancelar pedido</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        ListFooterComponent={
          <>
            <View style={styles.section}>
              <View style={styles.sectionRow}>
                <Text style={[styles.sectionTitle, { color: C.text }]}>Mis direcciones</Text>
                <TouchableOpacity onPress={() => setShowAddressForm((v) => !v)}>
                  <Text style={{ color: C.accent, fontWeight: "700" }}>+ Añadir</Text>
                </TouchableOpacity>
              </View>
              {showAddressForm && (
                <View style={[styles.addressForm, { backgroundColor: C.bgCard, borderColor: C.border }]}>
                  <TextInputCard label="Etiqueta (ej: Casa)" value={addr.label} onChangeText={(v) => setAddr({ ...addr, label: v })} />
                  <TextInputCard label="Dirección *" value={addr.address} onChangeText={(v) => setAddr({ ...addr, address: v })} />
                  <TextInputCard label="Ciudad *" value={addr.city} onChangeText={(v) => setAddr({ ...addr, city: v })} />
                  <TextInputCard label="Departamento" value={addr.department} onChangeText={(v) => setAddr({ ...addr, department: v })} />
                  <TextInputCard label="Código postal" value={addr.postal_code} onChangeText={(v) => setAddr({ ...addr, postal_code: v })} />
                  <TouchableOpacity
                    style={styles.checkboxRow}
                    onPress={() => setAddr({ ...addr, is_default: !addr.is_default })}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        { backgroundColor: addr.is_default ? C.accent : "transparent", borderColor: C.border },
                      ]}
                    >
                      {addr.is_default ? <Ionicons name="checkmark" size={12} color="#fff" /> : null}
                    </View>
                    <Text style={{ color: C.text, fontSize: 13 }}>Dirección por defecto</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveBtn, { backgroundColor: C.btnPrimary }]}
                    onPress={handleAddAddress}
                    disabled={savingAddress}
                  >
                    <Text style={{ color: "#fff", fontWeight: "700" }}>
                      {savingAddress ? "Guardando..." : "Guardar dirección"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
              {addresses.length === 0 && !showAddressForm ? (
                <Text style={{ color: C.textSecondary, fontSize: 13 }}>No tienes direcciones guardadas.</Text>
              ) : (
                addresses.map((item) => (
                  <View key={item.id} style={[styles.addressCard, { backgroundColor: C.bgCard, borderColor: C.border }]}>
                    <Text style={[styles.addressLabel, { color: C.text }]}>
                      {item.label || item.city} {item.is_default ? "(por defecto)" : ""}
                    </Text>
                    <Text style={{ color: C.textSecondary, fontSize: 13 }}>
                      {item.address}, {item.city}, {item.department}
                    </Text>
                  </View>
                ))
              )}
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: C.text }]}>Mis favoritos</Text>
              {favorites.length === 0 ? (
                <Text style={{ color: C.textSecondary, fontSize: 13 }}>No tienes productos favoritos.</Text>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                  {favorites.map((fav) => (
                    <TouchableOpacity
                      key={fav.id}
                      style={[styles.favCard, { backgroundColor: C.bgCard, borderColor: C.border }]}
                      onPress={() =>
                        navigation.navigate("ProductoDetalle", { id: fav.product.id })
                      }
                    >
                      <Text style={{ color: C.textSecondary, fontSize: 13, fontWeight: "600" }}>
                        {formatCOP(fav.product.price)}
                      </Text>
                      <Text numberOfLines={2} style={{ fontSize: 12, color: C.text, fontWeight: "600", marginTop: 6 }}>
                        {fav.product.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            <TouchableOpacity
              style={[styles.logoutBtn, { borderColor: C.errorBorder, backgroundColor: C.error }]}
              onPress={handleLogout}
            >
              <Text style={{ color: C.errorText, fontWeight: "800" }}>Cerrar sesión</Text>
            </TouchableOpacity>
          </>
        }
      />
    </View>
  );
}

function TextInputCard({
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
    <View style={{ marginBottom: 10 }}>
      <Text style={{ color: C.textSecondary, fontSize: 12, marginBottom: 4 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={label}
        placeholderTextColor={C.textSecondary}
        style={[
          styles.addrInput,
          { backgroundColor: C.inputBg, borderColor: C.inputBorder, color: C.text },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 20, fontWeight: "800" },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 17, fontWeight: "800" },
  profileEmail: { fontSize: 13, marginTop: 2 },
  memberSince: { fontSize: 12, marginTop: 4 },
  themeBtn: { padding: 6 },
  statsRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  statCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: "center",
  },
  statValue: { fontSize: 20, fontWeight: "900" },
  statLabel: { fontSize: 12, marginTop: 2 },
  section: { marginTop: 22 },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: "800", marginBottom: 12 },
  orderCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  orderHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  orderId: { fontSize: 13, fontWeight: "800" },
  orderStatus: { fontSize: 13, fontWeight: "700" },
  orderTotal: { fontSize: 15, fontWeight: "800", marginTop: 6 },
  addressForm: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 14 },
  addrInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  checkboxRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtn: { borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  addressCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  addressLabel: { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  favCard: {
    width: 130,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
  },
  logoutBtn: {
    marginTop: 28,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: "center",
  },
});