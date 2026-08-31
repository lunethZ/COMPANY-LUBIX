import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from "react-native";
import { Screen, Button, Field, Popup } from "../components/ui";
import AppHeader from "../components/AppHeader";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import axios from "axios";

type Tab = "products" | "orders" | "stats" | "profile";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  active: boolean;
  category: string;
}

interface CompanyOrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CompanyOrder {
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
  buyer_name: string;
  buyer_email: string;
  items: CompanyOrderItem[];
}

interface SellerInfo {
  name: string;
  email: string;
  phone: string;
  memberSince: string;
  rating: number;
  totalSales: number;
  totalReviews: number;
  sellerLevel: string;
  levelProgress: number;
}

const formatCOP = (v: number) => "$" + v.toLocaleString("es-CO", { maximumFractionDigits: 0 });

const orderStatusLabel = (s: string) => {
  const m: Record<string, string> = { pending: "Pendiente", confirmed: "Confirmado", shipped: "Enviado", delivered: "Entregado", cancelled: "Cancelado" };
  return m[s] || s;
};

const orderStatusColor = (s: string) => {
  const m: Record<string, string> = { pending: "#eab308", confirmed: "#3b82f6", shipped: "#a855f7", delivered: "#22c55e", cancelled: "#ef4444" };
  return m[s] || "#6b7280";
};

const INITIAL_SELLER: SellerInfo = { name: "", email: "", phone: "", memberSince: "", rating: 0, totalSales: 0, totalReviews: 0, sellerLevel: "Bronze", levelProgress: 0 };

export default function DashboardEmpresaScreen() {
  const { C } = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("products");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<CompanyOrder[]>([]);
  const [sellerInfo, setSellerInfo] = useState<SellerInfo>(INITIAL_SELLER);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [form, setForm] = useState({ name: "", price: "", stock: "", category: "", description: "" });
  const [profileForm, setProfileForm] = useState({ name: "", email: "", phone: "" });

  const showMessage = (msg: string, type: "success" | "error") => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => { setMessage(""); setMessageType(""); }, 3000);
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "products", label: "Mis Productos" },
    { key: "orders", label: "Pedidos" },
    { key: "stats", label: "Estadísticas" },
    { key: "profile", label: "Mi Perfil" },
  ];

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [meRes, profileRes, productsRes, ordersRes] = await Promise.all([
        api.get("/company/dashboard/me"),
        api.get("/company/dashboard/my-profile"),
        api.get("/company/products"),
        api.get("/company/orders"),
      ]);
      const me = meRes.data;
      const profile = profileRes.data;

      const totalSales = me.sales || profile.completeSales || 0;
      const avgRating = me.stars || profile.averageRating || 0;

      let sellerLevel = "Bronze";
      let levelProgress = 0;
      if (totalSales >= 500) { sellerLevel = "Diamond"; levelProgress = 100; }
      else if (totalSales >= 200) { sellerLevel = "Platinum"; levelProgress = Math.min(100, Math.round(((totalSales - 200) / 300) * 100)); }
      else if (totalSales >= 50) { sellerLevel = "Gold"; levelProgress = Math.min(100, Math.round(((totalSales - 50) / 150) * 100)); }
      else if (totalSales >= 10) { sellerLevel = "Silver"; levelProgress = Math.min(100, Math.round(((totalSales - 10) / 40) * 100)); }
      else { levelProgress = Math.min(100, Math.round((totalSales / 10) * 100)); }

      setSellerInfo({
        name: me.nameCompany || profile.nameCompany || user?.name || "",
        email: me.emailCompany || profile.emailCompany || "",
        phone: me.tellCompany || profile.tellCompany || "",
        memberSince: me.memberAT ? new Date(me.memberAT).toLocaleDateString() : "",
        rating: avgRating,
        totalSales,
        totalReviews: me.reviews || profile.totalReviews || 0,
        sellerLevel,
        levelProgress,
      });
      setProfileForm({ name: me.nameCompany || profile.nameCompany || "", email: me.emailCompany || profile.emailCompany || "", phone: me.tellCompany || profile.tellCompany || "" });

      setProducts((productsRes.data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        stock: p.stock,
        active: p.status !== "inactive",
        category: p.catalog_name || "General",
      })));
      setOrders(ordersRes.data || []);
    } catch (err) {
      console.error("Error fetching dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleAddProduct = async () => {
    if (!form.name || !form.price || !form.stock) { showMessage("Nombre, precio y stock son obligatorios", "error"); return; }
    setActionLoading("add");
    try {
      await api.post("/company/products", {
        name: form.name,
        price: parseInt(form.price.replace(/\D/g, "")) || 0,
        stock: parseInt(form.stock) || 0,
        descripcion: form.description || form.name,
        catalog_name: form.category || undefined,
        images: [],
        discount_enable: false,
        discount_value: 0,
      });
      showMessage("Producto creado", "success");
      setForm({ name: "", price: "", stock: "", category: "", description: "" });
      setShowAddModal(false);
      await fetchAll();
    } catch (err: any) {
      showMessage(err?.response?.data?.detail || "Error al crear producto", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const toggleActive = async (id: string) => {
    try {
      await api.patch(`/company/products/${id}/status`);
      await fetchAll();
    } catch (err) {
      showMessage("Error al cambiar estado", "error");
    }
  };

  const deleteProduct = async (id: string) => {
    setActionLoading(id);
    try {
      await api.delete(`/company/products/${id}`);
      showMessage("Producto eliminado", "success");
      setDeleteConfirm(null);
      await fetchAll();
    } catch (err) {
      showMessage("Error al eliminar producto", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleOrderStatus = async (orderId: string, newStatus: string) => {
    setActionLoading(orderId);
    try {
      await api.patch(`/company/orders/${orderId}/status`, { status: newStatus });
      showMessage("Estado actualizado", "success");
      await fetchAll();
    } catch (err: any) {
      showMessage(err?.response?.data?.detail || "Error al actualizar estado", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateProfile = async () => {
    if (!profileForm.name.trim()) return;
    setActionLoading("profile");
    try {
      await api.patch("/company/dashboard/upgrade-my-profile", {
        nameCompany: profileForm.name,
        emailCompany: profileForm.email,
        tellCompany: profileForm.phone,
      });
      showMessage("Perfil actualizado", "success");
      setShowEditProfile(false);
      await fetchAll();
    } catch (err: any) {
      showMessage(err?.response?.data?.detail || "Error al actualizar perfil", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const totalRevenue = products.reduce((a, p) => a + p.price * p.stock, 0);
  const activeProducts = products.filter((p) => p.active);

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Diamond": return "#06b6d4";
      case "Platinum": return "#a855f7";
      case "Gold": return "#eab308";
      case "Silver": return "#9ca3af";
      default: return "#f97316";
    }
  };

  if (loading) {
    return (
      <Screen>
        <AppHeader role="empresa" />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={C.accent} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <AppHeader role="empresa" />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {message ? <Popup message={message} type={messageType as "success" | "error"} /> : null}

        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
          <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: "#4ade80", alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 22, fontWeight: "800", color: "#000" }}>{sellerInfo.name?.charAt(0).toUpperCase() || "E"}</Text>
          </View>
          <View style={{ marginLeft: 14, flex: 1 }}>
            <Text style={{ color: C.text, fontSize: 18, fontWeight: "800" }}>{sellerInfo.name || "Tu Empresa"}</Text>
            <View style={{ backgroundColor: C.bgCard, alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 2, marginTop: 4 }}>
              <Text style={{ color: C.accent, fontSize: 11, fontWeight: "700" }}>Vendedor</Text>
            </View>
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

        {activeTab === "products" && (
          <>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <Text style={{ color: C.text, fontSize: 16, fontWeight: "700" }}>Mis Productos ({products.length})</Text>
              <Button title="+ Agregar" onPress={() => setShowAddModal(true)} style={{ paddingHorizontal: 16, paddingVertical: 8 }} />
            </View>
            {products.length === 0 ? (
              <View style={{ backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 24, alignItems: "center" }}>
                <Text style={{ fontSize: 34, marginBottom: 8 }}>📦</Text>
                <Text style={{ color: C.text, fontWeight: "700", fontSize: 16 }}>No tienes productos</Text>
                <Text style={{ color: C.textSecondary, fontSize: 13, textAlign: "center", marginTop: 4 }}>Agrega tu primer producto para vender</Text>
              </View>
            ) : (
              products.map((p) => (
                <View key={p.id} style={{ backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14, marginBottom: 10 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={{ color: C.text, fontWeight: "700", fontSize: 15, flex: 1 }}>{p.name}</Text>
                    <View style={{ backgroundColor: p.active ? "#22c55e" : "#6b7280", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 }}>
                      <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>{p.active ? "Activo" : "Inactivo"}</Text>
                    </View>
                  </View>
                  <Text style={{ color: C.textSecondary, fontSize: 13, marginTop: 6 }}>Stock: {p.stock} · Precio: {formatCOP(p.price)}</Text>
                  <Text style={{ color: C.textSecondary, fontSize: 12 }}>Categoría: {p.category}</Text>
                  <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                    <TouchableOpacity style={{ flex: 1, backgroundColor: C.btnSecondary, borderRadius: 999, paddingVertical: 8, alignItems: "center" }} onPress={() => toggleActive(p.id)}>
                      <Text style={{ color: C.text, fontWeight: "600", fontSize: 12 }}>{p.active ? "Desactivar" : "Activar"}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ flex: 1, backgroundColor: C.error, borderRadius: 999, paddingVertical: 8, alignItems: "center" }} onPress={() => setDeleteConfirm(p.id)}>
                      <Text style={{ color: "#fff", fontWeight: "600", fontSize: 12 }}>Eliminar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </>
        )}

        {activeTab === "orders" && (
          <>
            <Text style={{ color: C.text, fontSize: 18, fontWeight: "800", marginBottom: 12 }}>Pedidos recibidos ({orders.length})</Text>
            {orders.length === 0 ? (
              <View style={{ backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 24, alignItems: "center" }}>
                <Text style={{ fontSize: 34, marginBottom: 8 }}>🛒</Text>
                <Text style={{ color: C.text, fontWeight: "700", fontSize: 16 }}>No tienes pedidos</Text>
                <Text style={{ color: C.textSecondary, fontSize: 13, textAlign: "center", marginTop: 4 }}>Los pedidos de tus productos aparecerán aquí</Text>
              </View>
            ) : (
              orders.map((order) => (
                <View key={order.id} style={{ backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: 12, marginBottom: 10, overflow: "hidden" }}>
                  <TouchableOpacity style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14 }} onPress={() => setSelectedOrder(selectedOrder === order.id ? null : order.id)}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Text numberOfLines={1} style={{ color: C.text, fontWeight: "700", fontSize: 13, maxWidth: 100 }}>{order.id}</Text>
                        <View style={{ backgroundColor: orderStatusColor(order.status) + "20", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
                          <Text style={{ color: orderStatusColor(order.status), fontSize: 11, fontWeight: "700" }}>{orderStatusLabel(order.status)}</Text>
                        </View>
                      </View>
                      <Text style={{ color: C.textSecondary, fontSize: 11, marginTop: 4 }}>{order.buyer_name || order.buyer_email} · {new Date(order.created_at).toLocaleDateString("es-CO")}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={{ color: C.accent, fontWeight: "700" }}>{formatCOP(order.total)}</Text>
                      <Text style={{ color: C.textSecondary, fontSize: 11 }}>{order.items.length} producto(s)</Text>
                    </View>
                  </TouchableOpacity>

                  {selectedOrder === order.id && (
                    <View style={{ borderTopWidth: 1, borderTopColor: C.border, padding: 14, backgroundColor: C.bgSecondary }}>
                      <Text style={{ color: C.textSecondary, fontSize: 11, fontWeight: "700", marginBottom: 6 }}>PRODUCTOS</Text>
                      {order.items.map((item) => (
                        <View key={item.id} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                          <Text numberOfLines={1} style={{ color: C.text, fontSize: 13, flex: 1 }}>{item.name} x{item.quantity}</Text>
                          <Text style={{ color: C.text, fontWeight: "600", fontSize: 13 }}>{formatCOP(item.price * item.quantity)}</Text>
                        </View>
                      ))}

                      <Text style={{ color: C.textSecondary, fontSize: 11, fontWeight: "700", marginTop: 10, marginBottom: 6 }}>RESUMEN</Text>
                      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <Text style={{ color: C.textSecondary, fontSize: 13 }}>Subtotal</Text>
                        <Text style={{ color: C.text, fontSize: 13 }}>{formatCOP(order.subtotal)}</Text>
                      </View>
                      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <Text style={{ color: C.textSecondary, fontSize: 13 }}>Envío</Text>
                        <Text style={{ color: C.text, fontSize: 13 }}>{order.shipping === 0 ? "GRATIS" : formatCOP(order.shipping)}</Text>
                      </View>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: C.border, paddingTop: 6, marginTop: 6 }}>
                        <Text style={{ color: C.text, fontWeight: "700" }}>Total</Text>
                        <Text style={{ color: C.accent, fontWeight: "700" }}>{formatCOP(order.total)}</Text>
                      </View>

                      <Text style={{ color: C.textSecondary, fontSize: 11, fontWeight: "700", marginTop: 10, marginBottom: 6 }}>ENVÍO Y PAGO</Text>
                      <Text style={{ color: C.textSecondary, fontSize: 12 }}>📍 {order.recipient} · {order.address}, {order.city}</Text>
                      <Text style={{ color: C.textSecondary, fontSize: 12 }}>💳 {order.payment_method === "tarjeta" ? "Tarjeta" : order.payment_method === "pse" ? "PSE" : order.payment_method}</Text>

                      {order.status !== "delivered" && order.status !== "cancelled" && (
                        <View style={{ flexDirection: "row", gap: 8, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border }}>
                          {order.status === "pending" && (
                            <>
                              <TouchableOpacity style={{ flex: 1, backgroundColor: "#3b82f6", borderRadius: 999, paddingVertical: 8, alignItems: "center" }} onPress={() => handleOrderStatus(order.id, "confirmed")} disabled={actionLoading === order.id}>
                                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>Confirmar</Text>
                              </TouchableOpacity>
                              <TouchableOpacity style={{ flex: 1, backgroundColor: C.error, borderRadius: 999, paddingVertical: 8, alignItems: "center" }} onPress={() => handleOrderStatus(order.id, "cancelled")} disabled={actionLoading === order.id}>
                                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>Rechazar</Text>
                              </TouchableOpacity>
                            </>
                          )}
                          {order.status === "confirmed" && (
                            <TouchableOpacity style={{ flex: 1, backgroundColor: "#a855f7", borderRadius: 999, paddingVertical: 8, alignItems: "center" }} onPress={() => handleOrderStatus(order.id, "shipped")} disabled={actionLoading === order.id}>
                              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>Marcar enviado</Text>
                            </TouchableOpacity>
                          )}
                          {order.status === "shipped" && (
                            <TouchableOpacity style={{ flex: 1, backgroundColor: "#22c55e", borderRadius: 999, paddingVertical: 8, alignItems: "center" }} onPress={() => handleOrderStatus(order.id, "delivered")} disabled={actionLoading === order.id}>
                              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>Marcar entregado</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                    </View>
                  )}
                </View>
              ))
            )}
          </>
        )}

        {activeTab === "stats" && (
          <>
            <Text style={{ color: C.text, fontSize: 18, fontWeight: "800", marginBottom: 12 }}>Estadísticas</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 16 }}>
              {[
                { value: activeProducts.length.toString(), label: "Productos activos" },
                { value: sellerInfo.totalSales.toString(), label: "Ventas totales" },
                { value: formatCOP(totalRevenue), label: "Ingresos" },
                { value: sellerInfo.rating > 0 ? sellerInfo.rating.toFixed(1) : "N/A", label: "Calificación" },
              ].map((k) => (
                <View key={k.label} style={{ width: "48%", backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14, marginBottom: 10, alignItems: "center" }}>
                  <Text style={{ color: C.accent, fontSize: 18, fontWeight: "800" }}>{k.value}</Text>
                  <Text style={{ color: C.textSecondary, fontSize: 12, textAlign: "center" }}>{k.label}</Text>
                </View>
              ))}
            </View>
            <Text style={{ color: C.text, fontSize: 16, fontWeight: "700", marginBottom: 8 }}>Rendimiento por producto</Text>
            {products.length === 0 ? (
              <Text style={{ color: C.textSecondary, textAlign: "center", paddingVertical: 16 }}>No hay productos para mostrar</Text>
            ) : (
              products.map((p) => {
                const maxStock = Math.max(...products.map((x) => x.stock), 1);
                return (
                  <View key={p.id} style={{ backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 12, marginBottom: 8 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text numberOfLines={1} style={{ color: C.text, fontWeight: "600", flex: 1 }}>{p.name}</Text>
                      <Text style={{ color: C.accent, fontWeight: "700", fontSize: 12 }}>{p.stock} unidades</Text>
                    </View>
                    <View style={{ width: "100%", height: 6, backgroundColor: C.bgSecondary, borderRadius: 3, marginTop: 6, overflow: "hidden" }}>
                      <View style={{ width: `${(p.stock / maxStock) * 100}%`, height: 6, backgroundColor: C.accent, borderRadius: 3 }} />
                    </View>
                    <Text style={{ color: C.textSecondary, fontSize: 11, marginTop: 4 }}>{formatCOP(p.stock * p.price)}</Text>
                  </View>
                );
              })
            )}
          </>
        )}

        {activeTab === "profile" && (
          <>
            <Text style={{ color: C.text, fontSize: 18, fontWeight: "800", marginBottom: 12 }}>Información del vendedor</Text>
            <View style={{ backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14, marginBottom: 12 }}>
              {[
                { label: "Nombre de tienda", value: sellerInfo.name || "-" },
                { label: "Email", value: sellerInfo.email || "-" },
                { label: "Teléfono", value: sellerInfo.phone || "-" },
                { label: "Miembro desde", value: sellerInfo.memberSince || "-" },
              ].map((f) => (
                <View key={f.label} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border }}>
                  <Text style={{ color: C.textSecondary, fontSize: 13 }}>{f.label}</Text>
                  <Text style={{ color: C.text, fontWeight: "600", fontSize: 13, maxWidth: "60%" }}>{f.value}</Text>
                </View>
              ))}
            </View>
            <Button title="Editar información" variant="secondary" onPress={() => { setProfileForm({ name: sellerInfo.name, email: sellerInfo.email, phone: sellerInfo.phone }); setShowEditProfile(true); }} />

            {showEditProfile && (
              <View style={{ backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14, marginTop: 12 }}>
                <Text style={{ color: C.text, fontWeight: "700", fontSize: 14, marginBottom: 10 }}>Editar perfil de tienda</Text>
                <Field label="Nombre de la tienda" value={profileForm.name} onChangeText={(v) => setProfileForm((p) => ({ ...p, name: v }))} placeholder="TechStore" />
                <Field label="Email" value={profileForm.email} onChangeText={(v) => setProfileForm((p) => ({ ...p, email: v }))} placeholder="tienda@correo.com" keyboardType="email-address" autoCapitalize="none" />
                <Field label="Teléfono" value={profileForm.phone} onChangeText={(v) => setProfileForm((p) => ({ ...p, phone: v }))} placeholder="+57 300 000 0000" keyboardType="phone-pad" />
                <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
                  <View style={{ flex: 1 }}><Button title="Cancelar" variant="secondary" onPress={() => setShowEditProfile(false)} /></View>
                  <View style={{ flex: 1 }}><Button title="Guardar" onPress={handleUpdateProfile} loading={actionLoading === "profile"} /></View>
                </View>
              </View>
            )}

            <Text style={{ color: C.text, fontSize: 18, fontWeight: "800", marginTop: 20, marginBottom: 12 }}>Reputación y métricas</Text>
            <View style={{ backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14, marginBottom: 8 }}>
              {[
                { label: "Calificación promedio", value: sellerInfo.rating > 0 ? sellerInfo.rating.toFixed(1) + " / 5.0" : "N/A" },
                { label: "Total de reseñas", value: sellerInfo.totalReviews.toString() },
                { label: "Ventas completadas", value: sellerInfo.totalSales.toString() },
              ].map((f) => (
                <View key={f.label} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border }}>
                  <Text style={{ color: C.textSecondary, fontSize: 13 }}>{f.label}</Text>
                  <Text style={{ color: C.text, fontWeight: "600", fontSize: 13 }}>{f.value}</Text>
                </View>
              ))}
            </View>
            <View style={{ backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <Text style={{ color: C.textSecondary, fontSize: 13 }}>Nivel de vendedor</Text>
                <View style={{ backgroundColor: getLevelColor(sellerInfo.sellerLevel) + "20", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 }}>
                  <Text style={{ color: getLevelColor(sellerInfo.sellerLevel), fontSize: 12, fontWeight: "700" }}>{sellerInfo.sellerLevel}</Text>
                </View>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                <Text style={{ color: C.textSecondary, fontSize: 11 }}>Progreso nivel</Text>
                <Text style={{ color: C.textSecondary, fontSize: 11 }}>{sellerInfo.levelProgress}%</Text>
              </View>
              <View style={{ width: "100%", height: 8, backgroundColor: C.bgSecondary, borderRadius: 4, overflow: "hidden" }}>
                <View style={{ width: `${sellerInfo.levelProgress}%`, height: 8, backgroundColor: getLevelColor(sellerInfo.sellerLevel), borderRadius: 4 }} />
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {showAddModal && (
        <View style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: 20, zIndex: 30 }}>
          <View style={{ backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 20, maxHeight: "80%" }}>
            <ScrollView>
              <Text style={{ color: C.text, fontSize: 18, fontWeight: "800", marginBottom: 12 }}>Agregar nuevo producto</Text>
              <Field label="Nombre del producto *" value={form.name} onChangeText={(v) => setForm((p) => ({ ...p, name: v }))} placeholder="Ej: Smartphone Galaxy S24" />
              <Field label="Precio (COP) *" value={form.price} onChangeText={(v) => setForm((p) => ({ ...p, price: v }))} placeholder="Ej: 3500000" keyboardType="numeric" />
              <Field label="Stock *" value={form.stock} onChangeText={(v) => setForm((p) => ({ ...p, stock: v }))} placeholder="Ej: 20" keyboardType="numeric" />
              <Field label="Categoría" value={form.category} onChangeText={(v) => setForm((p) => ({ ...p, category: v }))} placeholder="Ej: Smartphones" />
              <Field label="Descripción" value={form.description} onChangeText={(v) => setForm((p) => ({ ...p, description: v }))} placeholder="Describe el producto..." multiline />
              <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                <View style={{ flex: 1 }}><Button title="Cancelar" variant="secondary" onPress={() => { setShowAddModal(false); setForm({ name: "", price: "", stock: "", category: "", description: "" }); }} /></View>
                <View style={{ flex: 1 }}><Button title="Publicar" onPress={handleAddProduct} loading={actionLoading === "add"} disabled={!form.name || !form.price || !form.stock} /></View>
              </View>
            </ScrollView>
          </View>
        </View>
      )}

      {deleteConfirm && (
        <View style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: 20, zIndex: 30 }}>
          <View style={{ backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.error, borderRadius: 16, padding: 24, alignItems: "center" }}>
            <Text style={{ fontSize: 34, marginBottom: 8 }}>⚠️</Text>
            <Text style={{ color: C.text, fontSize: 18, fontWeight: "800", marginBottom: 4 }}>¿Eliminar producto?</Text>
            <Text style={{ color: C.textSecondary, fontSize: 13, textAlign: "center", marginBottom: 16 }}>Esta acción no se puede deshacer.</Text>
            <View style={{ flexDirection: "row", gap: 8, width: "100%" }}>
              <View style={{ flex: 1 }}><Button title="Cancelar" variant="secondary" onPress={() => setDeleteConfirm(null)} /></View>
              <View style={{ flex: 1 }}><Button title="Eliminar" onPress={() => deleteProduct(deleteConfirm)} loading={actionLoading === deleteConfirm} style={{ backgroundColor: C.error }} /></View>
            </View>
          </View>
        </View>
      )}
    </Screen>
  );
}
