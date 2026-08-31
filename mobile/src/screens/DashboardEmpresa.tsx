import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { Screen } from "../components/ui";
import AppHeader from "../components/AppHeader";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { searchProducts } from "../api/products";
import { formatCOP } from "../utils/format";
import type { Product } from "../types/product";

type Tab = "products" | "stats" | "profile";

const sellerProductsFrom = (products: Product[]) =>
  products.map((p, idx) => ({
    ...p,
    active: idx % 2 === 0,
    sold: (idx + 1) * 5,
    views: (idx + 2) * 50,
  }));

export default function DashboardEmpresaScreen() {
  const { C } = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("products");
  const [showModal, setShowModal] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState({
    name: "",
    price: "",
    stock: "",
    category: "",
    description: "",
  });

  useEffect(() => {
    searchProducts({}).then(setProducts).catch(() => {});
  }, []);

  const sellerProducts = sellerProductsFrom(products);

  const tabs: { key: Tab; label: string }[] = [
    { key: "products", label: "Mis Productos" },
    { key: "stats", label: "Estadísticas" },
    { key: "profile", label: "Mi Perfil" },
  ];

  const totalSales = sellerProducts.reduce((s, p) => s + p.stock * p.price, 0);
  const revenue = sellerProducts.reduce((s, p) => s + p.views * 1000, 0);

  const setField = (key: keyof typeof form, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <Screen>
      <AppHeader role="empresa" />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
          <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: "#4ade80", alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 22, fontWeight: "800", color: "#000" }}>{user?.name?.charAt(0).toUpperCase() || "E"}</Text>
          </View>
          <View style={{ marginLeft: 14, flex: 1 }}>
            <Text style={{ color: C.text, fontSize: 18, fontWeight: "800" }}>{user?.name || "Tu Empresa"}</Text>
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
            <TouchableOpacity
              key={t.key}
              style={{ flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: activeTab === t.key ? C.btnPrimary : C.btnSecondary }}
              onPress={() => setActiveTab(t.key)}
            >
              <Text numberOfLines={1} style={{ textAlign: "center", fontSize: 11, fontWeight: "600", color: activeTab === t.key ? "#fff" : C.text }}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === "products" && (
          <>
            <TouchableOpacity style={{ backgroundColor: C.btnPrimary, borderRadius: 999, paddingVertical: 12, alignItems: "center", marginBottom: 16 }} onPress={() => setShowModal(true)}>
              <Text style={{ color: "#fff", fontWeight: "700" }}>+ Agregar nuevo producto</Text>
            </TouchableOpacity>
            {sellerProducts.map((p) => (
              <View key={p.id} style={{ backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14, marginBottom: 10 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ color: C.text, fontWeight: "700", fontSize: 15, flex: 1 }}>{p.name}</Text>
                  <View style={{ backgroundColor: p.active ? "#22c55e" : "#6b7280", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 }}>
                    <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>{p.active ? "Activo" : "Inactivo"}</Text>
                  </View>
                </View>
                <Text style={{ color: C.textSecondary, fontSize: 13, marginTop: 6 }}>Stock: {p.stock} · Precio: {formatCOP(p.price)}</Text>
                <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                  <TouchableOpacity style={{ flex: 1, backgroundColor: C.btnSecondary, borderRadius: 999, paddingVertical: 8, alignItems: "center" }}>
                    <Text style={{ color: C.text, fontWeight: "600", fontSize: 12 }}>Activar/Desactivar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={{ flex: 1, backgroundColor: C.error, borderRadius: 999, paddingVertical: 8, alignItems: "center" }}>
                    <Text style={{ color: "#fff", fontWeight: "600", fontSize: 12 }}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {showModal && (
              <View style={{ position: "absolute", left: 20, right: 20, top: 40, backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 20, zIndex: 20, shadowColor: C.shadow, shadowOpacity: 0.2, shadowRadius: 12 }}>
                <Text style={{ color: C.text, fontSize: 18, fontWeight: "800", marginBottom: 12 }}>Agregar nuevo producto</Text>
                {(
                  [
                    ["name", "Nombre"],
                    ["price", "Precio"],
                    ["stock", "Stock"],
                    ["description", "Descripción"],
                  ] as [keyof typeof form, string][]
                ).map(([key, label]) => (
                  <TextInput
                    key={key}
                    placeholder={label}
                    placeholderTextColor={C.textSecondary}
                    value={form[key]}
                    onChangeText={(v) => setField(key, v)}
                    style={{ backgroundColor: C.inputBg, borderWidth: 1, borderColor: C.inputBorder, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: C.text, marginBottom: 10 }}
                  />
                ))}
                <TouchableOpacity style={{ backgroundColor: C.btnPrimary, borderRadius: 999, paddingVertical: 10, alignItems: "center", marginTop: 6 }} onPress={() => setShowModal(false)}>
                  <Text style={{ color: "#fff", fontWeight: "700" }}>Guardar</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {activeTab === "stats" && (
          <>
            <Text style={{ color: C.text, fontSize: 18, fontWeight: "800", marginBottom: 12 }}>Estadísticas</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 16 }}>
              {[
                { value: sellerProducts.filter((p) => p.active).length.toString(), label: "Productos activos" },
                { value: (sellerProducts.length * 5).toString(), label: "Ventas totales" },
                { value: formatCOP(revenue), label: "Ingresos" },
                { value: "4.8", label: "Calificación" },
              ].map((k) => (
                <View key={k.label} style={{ width: "48%", backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14, marginBottom: 10, alignItems: "center" }}>
                  <Text style={{ color: C.accent, fontSize: 18, fontWeight: "800" }}>{k.value}</Text>
                  <Text style={{ color: C.textSecondary, fontSize: 12, textAlign: "center" }}>{k.label}</Text>
                </View>
              ))}
            </View>
            <Text style={{ color: C.text, fontSize: 16, fontWeight: "700", marginBottom: 8 }}>Rendimiento por producto</Text>
            {sellerProducts.map((p) => (
              <View key={p.id} style={{ backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 12, marginBottom: 8 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text numberOfLines={1} style={{ color: C.text, fontWeight: "600", flex: 1 }}>{p.name}</Text>
                  <Text style={{ color: C.accent, fontWeight: "700" }}>{p.views} vistas</Text>
                </View>
                <Text style={{ color: C.textSecondary, fontSize: 12, marginTop: 4 }}>Ventas: {p.stock} · {formatCOP(p.stock * p.price)}</Text>
              </View>
            ))}
          </>
        )}

        {activeTab === "profile" && (
          <>
            <Text style={{ color: C.text, fontSize: 18, fontWeight: "800", marginBottom: 12 }}>Información del vendedor</Text>
            {[
              { label: "Nombre", value: user?.name || "-" },
              { label: "Email", value: user?.email || "-" },
              { label: "Teléfono", value: "-" },
            ].map((field) => (
              <View key={field.label} style={{ flexDirection: "row", justifyContent: "space-between", backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 14, marginBottom: 8 }}>
                <Text style={{ color: C.textSecondary, fontSize: 13 }}>{field.label}</Text>
                <Text style={{ color: C.text, fontWeight: "600", fontSize: 13 }}>{field.value}</Text>
              </View>
            ))}
            <Text style={{ color: C.text, fontSize: 18, fontWeight: "800", marginTop: 16, marginBottom: 12 }}>Reputación y métricas</Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between", backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 14, marginBottom: 8 }}>
              <Text style={{ color: C.textSecondary, fontSize: 13 }}>Calificación</Text>
              <Text style={{ color: C.accent, fontWeight: "700" }}>4.8 / 5.0</Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 14 }}>
              <Text style={{ color: C.textSecondary, fontSize: 13 }}>Miembro desde</Text>
              <Text style={{ color: C.text, fontWeight: "600" }}>-</Text>
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}