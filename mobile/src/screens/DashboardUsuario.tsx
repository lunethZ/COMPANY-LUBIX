import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from "react-native";
import { Screen, Button, Field, Popup } from "../components/ui";
import AppHeader from "../components/AppHeader";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import axios from "axios";

type Tab = "overview" | "orders" | "saved" | "profile";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  status: string;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  payment_method: string;
  recipient: string;
  address: string;
  city: string;
  created_at: string;
  estimated_delivery: string;
  delivery_progress: number;
  items: OrderItem[];
}

interface FavoriteItem {
  id: string;
  product: {
    id: string;
    name: string;
    price: number;
    images: string[];
    company_name: string;
  };
}

interface Address {
  id: string;
  label: string;
  address: string;
  city: string;
  department: string;
  postal_code: string;
  is_default: boolean;
}

const formatCOP = (v: number) => "$" + v.toLocaleString("es-CO", { maximumFractionDigits: 0 });

const estadoLabel = (s: string) => {
  const m: Record<string, string> = { pending: "Pendiente", paid: "Pagado", shipped: "Enviado", delivered: "Entregado", cancelled: "Cancelado", confirmed: "Confirmado" };
  return m[s] || s;
};

const estadoColor = (s: string) => {
  const m: Record<string, string> = { pending: "#eab308", confirmed: "#3b82f6", shipped: "#a855f7", delivered: "#22c55e", cancelled: "#ef4444", paid: "#3b82f6" };
  return m[s] || "#6b7280";
};

export default function DashboardUsuarioScreen() {
  const { C } = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [loading, setLoading] = useState(true);

  const [userData, setUserData] = useState({
    name: "", email: "", phone: "", memberSince: "", totalOrders: 0, totalSpent: 0, savedProducts: 0, addresses: 0,
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);

  const [profileForm, setProfileForm] = useState({ name: "", phone: "" });
  const [passForm, setPassForm] = useState({ current: "", newPass: "" });
  const [addressForm, setAddressForm] = useState({ label: "", address: "", city: "", department: "", postal_code: "" });
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingPass, setEditingPass] = useState(false);
  const [addingAddress, setAddingAddress] = useState(false);

  const showMessage = (msg: string, type: "success" | "error") => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => { setMessage(""); setMessageType(""); }, 3000);
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Resumen" },
    { key: "orders", label: "Mis Pedidos" },
    { key: "saved", label: "Guardados" },
    { key: "profile", label: "Mi Perfil" },
  ];

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [meRes, ordersRes, favsRes, addrRes] = await Promise.all([
        api.get("/user/dashboard/me"),
        api.get("/user/orders"),
        api.get("/user/favorites"),
        api.get("/user/addresses"),
      ]);
      const me = meRes.data;
      setUserData({
        name: me.fullName || user?.name || "",
        email: me.email || user?.email || "",
        phone: me.tell || "",
        memberSince: me.memberSince ? new Date(me.memberSince).toLocaleDateString() : "",
        totalOrders: me.totalOrders || 0,
        totalSpent: me.totalSpent || 0,
        savedProducts: me.savedProducts || 0,
        addresses: me.addresses || 0,
      });
      setProfileForm({ name: me.fullName || "", phone: me.tell || "" });
      setOrders(ordersRes.data || []);
      setFavorites(favsRes.data || []);
      setAddresses(addrRes.data || []);
    } catch (err) {
      console.error("Error fetching dashboard:", err);
      if (user) setUserData((p) => ({ ...p, name: user.name, email: user.email }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const saveProfile = async () => {
    setEditingProfile(true);
    try {
      await api.patch("/user/profile", { fullName: profileForm.name, tell: profileForm.phone });
      showMessage("Perfil actualizado", "success");
      setUserData((p) => ({ ...p, name: profileForm.name, phone: profileForm.phone }));
    } catch (err: any) {
      showMessage(err?.response?.data?.detail || "Error al actualizar", "error");
    } finally {
      setEditingProfile(false);
    }
  };

  const savePassword = async () => {
    setEditingPass(true);
    try {
      await api.patch("/user/change-password", { current_password: passForm.current, new_password: passForm.newPass });
      showMessage("Contraseña actualizada", "success");
      setPassForm({ current: "", newPass: "" });
    } catch (err: any) {
      showMessage(err?.response?.data?.detail || "Error al cambiar contraseña", "error");
    } finally {
      setEditingPass(false);
    }
  };

  const addAddress = async () => {
    if (!addressForm.address.trim() || !addressForm.city.trim()) {
      showMessage("Dirección y ciudad son obligatorias", "error");
      return;
    }
    setAddingAddress(true);
    try {
      await api.post("/user/addresses", { ...addressForm, is_default: addresses.length === 0 });
      showMessage("Dirección agregada", "success");
      setAddressForm({ label: "", address: "", city: "", department: "", postal_code: "" });
      const res = await api.get("/user/addresses");
      setAddresses(res.data || []);
      setUserData((p) => ({ ...p, addresses: (res.data || []).length }));
    } catch (err: any) {
      showMessage(err?.response?.data?.detail || "Error al agregar dirección", "error");
    } finally {
      setAddingAddress(false);
    }
  };

  const removeAddress = async (id: string) => {
    try {
      await api.delete(`/user/addresses/${id}`);
      const res = await api.get("/user/addresses");
      setAddresses(res.data || []);
      setUserData((p) => ({ ...p, addresses: (res.data || []).length }));
    } catch (err) {
      showMessage("Error al eliminar dirección", "error");
    }
  };

  const removeFavorite = async (productId: string) => {
    try {
      await api.post(`/user/favorites/${productId}`);
      const res = await api.get("/user/favorites");
      setFavorites(res.data || []);
    } catch (err) {
      showMessage("Error al quitar favorito", "error");
    }
  };

  if (loading) {
    return (
      <Screen>
        <AppHeader role="user" />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={C.accent} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <AppHeader role="user" />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {message ? <Popup message={message} type={messageType as "success" | "error"} /> : null}

        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
          <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: "#4ade80", alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 22, fontWeight: "800", color: "#000" }}>{userData.name?.charAt(0).toUpperCase() || "U"}</Text>
          </View>
          <View style={{ marginLeft: 14, flex: 1 }}>
            <Text style={{ color: C.text, fontSize: 18, fontWeight: "800" }}>{userData.name}</Text>
            <Text style={{ color: C.textSecondary, fontSize: 13 }}>{userData.email}</Text>
          </View>
          <TouchableOpacity style={{ backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }} onPress={() => setActiveTab("profile")}>
            <Text style={{ color: C.textSecondary, fontSize: 12 }}>Editar perfil</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: "row", marginBottom: 20, gap: 6 }}>
          {tabs.map((t) => (
            <TouchableOpacity key={t.key} style={{ flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: activeTab === t.key ? C.btnPrimary : C.btnSecondary }} onPress={() => setActiveTab(t.key)}>
              <Text numberOfLines={1} style={{ textAlign: "center", fontSize: 11, fontWeight: "600", color: activeTab === t.key ? "#fff" : C.text }}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === "overview" && (
          <>
            <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 16 }}>
              {[
                { value: orders.length.toString(), label: "Pedidos" },
                { value: formatCOP(userData.totalSpent), label: "Total gastado" },
                { value: favorites.length.toString(), label: "Guardados" },
                { value: userData.addresses.toString(), label: "Direcciones" },
              ].map((k) => (
                <View key={k.label} style={{ width: "48%", backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14, marginBottom: 10, alignItems: "center" }}>
                  <Text style={{ color: C.accent, fontSize: 18, fontWeight: "800" }}>{k.value}</Text>
                  <Text style={{ color: C.textSecondary, fontSize: 12, textAlign: "center" }}>{k.label}</Text>
                </View>
              ))}
            </View>

            {favorites.length > 0 && (
              <>
                <Text style={{ color: C.text, fontSize: 16, fontWeight: "700", marginBottom: 8 }}>Productos guardados</Text>
                {favorites.slice(0, 3).map((f) => (
                  <View key={f.id} style={{ backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 12, marginBottom: 8, flexDirection: "row", alignItems: "center" }}>
                    <View style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: C.bgSecondary, alignItems: "center", justifyContent: "center" }}>
                      <Text>♡</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text numberOfLines={1} style={{ color: C.text, fontWeight: "600", fontSize: 14 }}>{f.product.name}</Text>
                      <Text style={{ color: C.accent, fontSize: 13 }}>{formatCOP(f.product.price)}</Text>
                    </View>
                    <TouchableOpacity onPress={() => removeFavorite(f.product.id)}>
                      <Text style={{ color: C.error, fontSize: 12 }}>Quitar</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </>
            )}

            {favorites.length === 0 && orders.length === 0 && (
              <View style={{ backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 24, alignItems: "center" }}>
                <Text style={{ fontSize: 34, marginBottom: 8 }}>🛒</Text>
                <Text style={{ color: C.text, fontWeight: "700", fontSize: 16 }}>Bienvenido a Lubix</Text>
                <Text style={{ color: C.textSecondary, fontSize: 13, textAlign: "center", marginTop: 4 }}>Explora productos y empieza a comprar</Text>
              </View>
            )}
          </>
        )}

        {activeTab === "orders" && (
          <>
            <Text style={{ color: C.text, fontSize: 18, fontWeight: "800", marginBottom: 12 }}>Mis pedidos ({orders.length})</Text>
            {orders.length === 0 ? (
              <View style={{ backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 24, alignItems: "center" }}>
                <Text style={{ fontSize: 34, marginBottom: 8 }}>📦</Text>
                <Text style={{ color: C.text, fontWeight: "700", fontSize: 16 }}>No tienes pedidos</Text>
                <Text style={{ color: C.textSecondary, fontSize: 13, textAlign: "center", marginTop: 4 }}>Tus compras aparecerán aquí</Text>
              </View>
            ) : (
              orders.map((order) => (
                <View key={order.id} style={{ backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: 12, marginBottom: 10, overflow: "hidden" }}>
                  <TouchableOpacity style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14 }} onPress={() => setSelectedOrder(selectedOrder === order.id ? null : order.id)}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Text numberOfLines={1} style={{ color: C.text, fontWeight: "700", fontSize: 13, maxWidth: 120 }}>{order.id}</Text>
                        <View style={{ backgroundColor: estadoColor(order.status) + "20", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
                          <Text style={{ color: estadoColor(order.status), fontSize: 11, fontWeight: "700" }}>{estadoLabel(order.status)}</Text>
                        </View>
                      </View>
                      <Text style={{ color: C.textSecondary, fontSize: 11, marginTop: 4 }}>{new Date(order.created_at).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={{ color: C.accent, fontWeight: "700" }}>{formatCOP(order.total)}</Text>
                      <Text style={{ color: C.textSecondary, fontSize: 11 }}>{order.items.length} producto(s)</Text>
                    </View>
                  </TouchableOpacity>

                  {selectedOrder === order.id && (
                    <View style={{ borderTopWidth: 1, borderTopColor: C.border, padding: 14, backgroundColor: C.bgSecondary }}>
                      <View style={{ marginBottom: 12 }}>
                        <Text style={{ color: C.textSecondary, fontSize: 11, fontWeight: "700", marginBottom: 6 }}>PRODUCTOS</Text>
                        {order.items.map((item) => (
                          <View key={item.id} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                            <Text numberOfLines={1} style={{ color: C.text, fontSize: 13, flex: 1 }}>{item.name} x{item.quantity}</Text>
                            <Text style={{ color: C.text, fontWeight: "600", fontSize: 13 }}>{formatCOP(item.price * item.quantity)}</Text>
                          </View>
                        ))}
                      </View>

                      <View style={{ marginBottom: 12 }}>
                        <Text style={{ color: C.textSecondary, fontSize: 11, fontWeight: "700", marginBottom: 6 }}>RESUMEN</Text>
                        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                          <Text style={{ color: C.textSecondary, fontSize: 13 }}>Subtotal</Text>
                          <Text style={{ color: C.text, fontSize: 13 }}>{formatCOP(order.subtotal)}</Text>
                        </View>
                        {order.discount > 0 && (
                          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                            <Text style={{ color: C.textSecondary, fontSize: 13 }}>Descuento</Text>
                            <Text style={{ color: C.accent, fontSize: 13 }}>-{formatCOP(order.discount)}</Text>
                          </View>
                        )}
                        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                          <Text style={{ color: C.textSecondary, fontSize: 13 }}>Envío</Text>
                          <Text style={{ color: C.text, fontSize: 13 }}>{order.shipping === 0 ? "GRATIS" : formatCOP(order.shipping)}</Text>
                        </View>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: C.border, paddingTop: 6, marginTop: 6 }}>
                          <Text style={{ color: C.text, fontWeight: "700" }}>Total</Text>
                          <Text style={{ color: C.accent, fontWeight: "700" }}>{formatCOP(order.total)}</Text>
                        </View>
                      </View>

                      <View>
                        <Text style={{ color: C.textSecondary, fontSize: 11, fontWeight: "700", marginBottom: 6 }}>ENVÍO Y PAGO</Text>
                        <Text style={{ color: C.textSecondary, fontSize: 12 }}>📍 {order.recipient} · {order.address}, {order.city}</Text>
                        <Text style={{ color: C.textSecondary, fontSize: 12 }}>💳 {order.payment_method === "tarjeta" ? "Tarjeta" : order.payment_method === "pse" ? "PSE" : order.payment_method}</Text>
                      </View>
                    </View>
                  )}
                </View>
              ))
            )}
          </>
        )}

        {activeTab === "saved" && (
          <>
            <Text style={{ color: C.text, fontSize: 18, fontWeight: "800", marginBottom: 12 }}>Productos guardados ({favorites.length})</Text>
            {favorites.length === 0 ? (
              <View style={{ backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 24, alignItems: "center" }}>
                <Text style={{ fontSize: 34, marginBottom: 8 }}>♡</Text>
                <Text style={{ color: C.text, fontWeight: "700", fontSize: 16 }}>No tienes productos guardados</Text>
                <Text style={{ color: C.textSecondary, fontSize: 13, textAlign: "center", marginTop: 4 }}>Ve al inicio y haz clic en el corazón para guardar</Text>
              </View>
            ) : (
              favorites.map((f) => (
                <View key={f.id} style={{ backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 12, marginBottom: 10 }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View style={{ width: 50, height: 50, borderRadius: 8, backgroundColor: C.bgSecondary, alignItems: "center", justifyContent: "center" }}>
                      <Text>📦</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text numberOfLines={1} style={{ color: C.text, fontWeight: "600", fontSize: 14 }}>{f.product.name}</Text>
                      <Text style={{ color: C.textSecondary, fontSize: 12 }}>{f.product.company_name}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                    <Text style={{ color: C.accent, fontWeight: "800", fontSize: 15 }}>{formatCOP(f.product.price)}</Text>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <TouchableOpacity style={{ backgroundColor: C.error, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }} onPress={() => removeFavorite(f.product.id)}>
                        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>Quitar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            )}
          </>
        )}

        {activeTab === "profile" && (
          <>
            <Text style={{ color: C.text, fontSize: 18, fontWeight: "800", marginBottom: 12 }}>Información personal</Text>
            <View style={{ backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14, marginBottom: 12 }}>
              {[
                { label: "Nombre", value: userData.name },
                { label: "Email", value: userData.email },
                { label: "Teléfono", value: userData.phone || "-" },
                { label: "Miembro desde", value: userData.memberSince || "-" },
              ].map((f) => (
                <View key={f.label} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border }}>
                  <Text style={{ color: C.textSecondary, fontSize: 13 }}>{f.label}</Text>
                  <Text style={{ color: C.text, fontWeight: "600", fontSize: 13, maxWidth: "60%" }}>{f.value}</Text>
                </View>
              ))}
            </View>
            <Button title="Editar información" variant="secondary" onPress={() => { setProfileForm({ name: userData.name, phone: userData.phone }); setEditingProfile(true); }} />

            {editingProfile && (
              <View style={{ backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14, marginTop: 12 }}>
                <Text style={{ color: C.text, fontWeight: "700", fontSize: 14, marginBottom: 10 }}>Editar perfil</Text>
                <Field label="Nombre completo" value={profileForm.name} onChangeText={(v) => setProfileForm((p) => ({ ...p, name: v }))} placeholder="Tu nombre" />
                <Field label="Teléfono" value={profileForm.phone} onChangeText={(v) => setProfileForm((p) => ({ ...p, phone: v }))} placeholder="Tu teléfono" keyboardType="phone-pad" />
                <Field label="Email" value={userData.email} editable={false} />
                <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
                  <View style={{ flex: 1 }}><Button title="Cancelar" variant="secondary" onPress={() => setEditingProfile(false)} /></View>
                  <View style={{ flex: 1 }}><Button title="Guardar" onPress={saveProfile} loading={editingProfile} /></View>
                </View>
              </View>
            )}

            <Text style={{ color: C.text, fontSize: 18, fontWeight: "800", marginTop: 20, marginBottom: 12 }}>Seguridad</Text>
            <Button title="Cambiar contraseña" variant="secondary" onPress={() => setEditingPass(!editingPass)} />
            {editingPass && (
              <View style={{ backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14, marginTop: 12 }}>
                <Field label="Contraseña actual" value={passForm.current} onChangeText={(v) => setPassForm((p) => ({ ...p, current: v }))} placeholder="••••••••" secureTextEntry />
                <Field label="Nueva contraseña" value={passForm.newPass} onChangeText={(v) => setPassForm((p) => ({ ...p, newPass: v }))} placeholder="••••••••" secureTextEntry />
                <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
                  <View style={{ flex: 1 }}><Button title="Cancelar" variant="secondary" onPress={() => { setEditingPass(false); setPassForm({ current: "", newPass: "" }); }} /></View>
                  <View style={{ flex: 1 }}><Button title="Cambiar" onPress={savePassword} loading={editingPass} /></View>
                </View>
              </View>
            )}

            <Text style={{ color: C.text, fontSize: 18, fontWeight: "800", marginTop: 20, marginBottom: 12 }}>Mis direcciones ({addresses.length})</Text>
            <View style={{ backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14, marginBottom: 12 }}>
              <Field label="Etiqueta" value={addressForm.label} onChangeText={(v) => setAddressForm((p) => ({ ...p, label: v }))} placeholder="Casa, Oficina..." />
              <Field label="Dirección" value={addressForm.address} onChangeText={(v) => setAddressForm((p) => ({ ...p, address: v }))} placeholder="Calle 123 #45-67" />
              <Field label="Ciudad" value={addressForm.city} onChangeText={(v) => setAddressForm((p) => ({ ...p, city: v }))} placeholder="Bogotá" />
              <Field label="Departamento" value={addressForm.department} onChangeText={(v) => setAddressForm((p) => ({ ...p, department: v }))} placeholder="Cundinamarca" />
              <Field label="Código postal" value={addressForm.postal_code} onChangeText={(v) => setAddressForm((p) => ({ ...p, postal_code: v }))} placeholder="110111" />
              <Button title="Agregar dirección" onPress={addAddress} loading={addingAddress} />
            </View>
            {addresses.map((addr) => (
              <View key={addr.id} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 14, marginBottom: 8 }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={{ color: C.text, fontWeight: "600", fontSize: 13 }}>{addr.label || "Dirección"}</Text>
                    {addr.is_default && <Text style={{ color: C.accent, fontSize: 11, marginLeft: 6 }}>Principal</Text>}
                  </View>
                  <Text style={{ color: C.textSecondary, fontSize: 12 }}>{addr.address}, {addr.city}, {addr.department}</Text>
                </View>
                <TouchableOpacity onPress={() => removeAddress(addr.id)}>
                  <Text style={{ color: C.error, fontSize: 12, fontWeight: "600" }}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
