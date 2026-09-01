import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { Screen, Button, Popup } from "../components/ui";
import AppHeader from "../components/AppHeader";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import axios from "axios";

type Tab = "resumen" | "empresas" | "usuarios" | "pqrs";

interface Stats {
  totalUsers: number;
  totalCompanies: number;
  pendingCompanies: number;
  activeUsers: number;
  inactiveUsers: number;
}

interface CompanyItem {
  id: string;
  userId: string;
  nameCompany: string;
  nit: string;
  nitDV: string;
  addressCompany: string;
  email: string;
  ownerName: string;
  ownerTell: string;
  verified: boolean;
  isActive: boolean;
  memberSince: string;
}

interface UserItem {
  id: string;
  fullName: string;
  email: string;
  tell: string;
  role: string | null;
  verified: boolean;
  isActive: boolean;
  memberSince: string;
}

interface PQRSItem {
  id: string;
  type: string;
  subject: string;
  description: string;
  status: string;
  user_role: string;
  user_name: string;
  user_email: string;
  created_at: string;
}

const pqrsTypeColor = (t: string) => {
  const m: Record<string, string> = { peticion: "#3b82f6", queja: "#ef4444", reclamo: "#f97316", sugerencia: "#eab308", eliminacion: "#6b7280" };
  return m[t] || "#6b7280";
};

const pqrsTypeLabel = (t: string) => {
  const m: Record<string, string> = { peticion: "Petición", queja: "Queja", reclamo: "Reclamo", sugerencia: "Sugerencia", eliminacion: "Eliminación" };
  return m[t] || t;
};

export default function DashboardAdminScreen() {
  const { C } = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("resumen");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalCompanies: 0, pendingCompanies: 0, activeUsers: 0, inactiveUsers: 0 });
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [pqrsList, setPqrsList] = useState<PQRSItem[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const showMessage = (msg: string, type: "success" | "error") => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => { setMessage(""); setMessageType(""); }, 3000);
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "resumen", label: "Resumen" },
    { key: "empresas", label: `Empresas (${companies.length})` },
    { key: "usuarios", label: `Usuarios (${users.length})` },
    { key: "pqrs", label: `PQRS (${pqrsList.length})` },
  ];

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [sRes, cRes, uRes, pRes] = await Promise.all([
        api.get("/admin/dashboard/me"),
        api.get("/admin/companies"),
        api.get("/admin/users"),
        api.get("/admin/pqrs"),
      ]);
      setStats(sRes.data);
      setCompanies(cRes.data || []);
      setUsers(uRes.data || []);
      setPqrsList(pRes.data || []);
    } catch (err) {
      console.error("Error fetching admin data:", err);
      showMessage("Error al cargar datos del panel", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleValidate = async (company: CompanyItem) => {
    setActionLoading(company.id);
    try {
      await api.patch(`/admin/companies/${company.id}/validate`);
      showMessage("Empresa validada correctamente", "success");
      await fetchAll();
    } catch (err: any) {
      showMessage(err?.response?.data?.detail || "Error al validar empresa", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      await api.delete(`/admin/users/${userId}`);
      showMessage("Usuario eliminado", "success");
      setDeleteConfirm(null);
      await fetchAll();
    } catch (err: any) {
      showMessage(err?.response?.data?.detail || "Error al eliminar usuario", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleResolvePQRS = async (pqrsId: string) => {
    setActionLoading(pqrsId);
    try {
      await api.patch(`/admin/pqrs/${pqrsId}/status`);
      showMessage("PQRS marcada como resuelta", "success");
      await fetchAll();
    } catch (err: any) {
      showMessage(err?.response?.data?.detail || "Error al resolver PQRS", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const pendingCompanies = companies.filter((c) => !c.verified);

  if (loading) {
    return (
      <Screen>
        <AppHeader role="admin" />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={C.accent} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <AppHeader role="admin" />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {message ? <Popup message={message} type={messageType as "success" | "error"} /> : null}

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <View>
            <Text style={{ color: C.text, fontSize: 22, fontWeight: "800" }}>Panel de Administración</Text>
            <Text style={{ color: C.textSecondary, fontSize: 13 }}>Gestión de usuarios y empresas</Text>
          </View>
          {user && <Text style={{ color: C.textSecondary, fontSize: 12 }}>Sesión: {user.name}</Text>}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {tabs.map((t) => (
              <TouchableOpacity key={t.key} style={{ backgroundColor: activeTab === t.key ? C.btnPrimary : C.btnSecondary, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 }} onPress={() => setActiveTab(t.key)}>
                <Text style={{ color: activeTab === t.key ? "#fff" : C.text, fontWeight: "600", fontSize: 12 }}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {activeTab === "resumen" && (
          <>
            <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 16 }}>
              {[
                { value: stats.totalUsers.toLocaleString("es-CO"), label: "Usuarios registrados", icon: "👤" },
                { value: stats.totalCompanies.toLocaleString("es-CO"), label: "Empresas registradas", icon: "🏢" },
                { value: stats.pendingCompanies.toLocaleString("es-CO"), label: "Empresas por validar", icon: "⏳" },
                { value: stats.activeUsers.toLocaleString("es-CO"), label: "Cuentas activas", icon: "✅" },
              ].map((kpi) => (
                <View key={kpi.label} style={{ width: "48%", backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14, marginBottom: 10 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={{ color: C.textSecondary, fontSize: 11 }}>{kpi.label}</Text>
                    <Text style={{ fontSize: 16 }}>{kpi.icon}</Text>
                  </View>
                  <Text style={{ color: C.text, fontSize: 20, fontWeight: "800", marginTop: 4 }}>{kpi.value}</Text>
                </View>
              ))}
            </View>

            <View style={{ backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14, marginBottom: 16 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <Text style={{ color: C.text, fontWeight: "700", fontSize: 14 }}>Empresas por validar ({pendingCompanies.length})</Text>
                <TouchableOpacity onPress={() => setActiveTab("empresas")}>
                  <Text style={{ color: C.accent, fontSize: 12 }}>Ver todas</Text>
                </TouchableOpacity>
              </View>
              {pendingCompanies.length === 0 ? (
                <View style={{ alignItems: "center", paddingVertical: 16 }}>
                  <Text style={{ fontSize: 24, marginBottom: 4 }}>✅</Text>
                  <Text style={{ color: C.textSecondary, fontSize: 13, textAlign: "center" }}>No hay empresas pendientes de validación</Text>
                </View>
              ) : (
                pendingCompanies.map((comp) => (
                  <View key={comp.id} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border }}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Text style={{ color: C.text, fontWeight: "700", fontSize: 14 }}>{comp.nameCompany}</Text>
                        <View style={{ backgroundColor: "#eab308" + "20", borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2 }}>
                          <Text style={{ color: "#eab308", fontSize: 10, fontWeight: "700" }}>Pendiente</Text>
                        </View>
                      </View>
                      <Text style={{ color: C.textSecondary, fontSize: 12 }}>NIT: {comp.nit}-{comp.nitDV}</Text>
                      <Text style={{ color: C.textSecondary, fontSize: 11 }}>{comp.email}</Text>
                    </View>
                    <TouchableOpacity style={{ backgroundColor: C.btnPrimary, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 }} onPress={() => handleValidate(comp)} disabled={actionLoading === comp.id}>
                      {actionLoading === comp.id ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>Validar</Text>}
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          </>
        )}

        {activeTab === "empresas" && (
          <>
            <Text style={{ color: C.text, fontSize: 18, fontWeight: "800", marginBottom: 12 }}>Empresas registradas ({companies.length})</Text>
            {companies.length === 0 ? (
              <View style={{ backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 24, alignItems: "center" }}>
                <Text style={{ fontSize: 34, marginBottom: 8 }}>🏢</Text>
                <Text style={{ color: C.text, fontWeight: "700", fontSize: 16 }}>No hay empresas registradas</Text>
              </View>
            ) : (
              companies.map((comp) => (
                <View key={comp.id} style={{ backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14, marginBottom: 10 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Text style={{ color: C.text, fontWeight: "700", fontSize: 14 }}>{comp.nameCompany}</Text>
                        <View style={{ backgroundColor: comp.verified ? "#22c55e" + "20" : "#eab308" + "20", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
                          <Text style={{ color: comp.verified ? "#22c55e" : "#eab308", fontSize: 10, fontWeight: "700" }}>{comp.verified ? "Validada" : "Pendiente"}</Text>
                        </View>
                      </View>
                      <Text style={{ color: C.textSecondary, fontSize: 12, marginTop: 2 }}>NIT: {comp.nit}-{comp.nitDV}</Text>
                      <Text style={{ color: C.textSecondary, fontSize: 12 }}>📍 {comp.addressCompany}</Text>
                      <Text style={{ color: C.textSecondary, fontSize: 12 }}>👤 {comp.ownerName} · {comp.ownerTell}</Text>
                      <Text style={{ color: C.textSecondary, fontSize: 11, marginTop: 2 }}>📧 {comp.email}</Text>
                    </View>
                    {!comp.verified && (
                      <TouchableOpacity style={{ backgroundColor: C.btnPrimary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }} onPress={() => handleValidate(comp)} disabled={actionLoading === comp.id}>
                        {actionLoading === comp.id ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "700", fontSize: 11 }}>Validar</Text>}
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            )}
          </>
        )}

        {activeTab === "usuarios" && (
          <>
            <Text style={{ color: C.text, fontSize: 18, fontWeight: "800", marginBottom: 12 }}>Usuarios registrados ({users.length})</Text>
            {users.length === 0 ? (
              <View style={{ backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 24, alignItems: "center" }}>
                <Text style={{ fontSize: 34, marginBottom: 8 }}>👤</Text>
                <Text style={{ color: C.text, fontWeight: "700", fontSize: 16 }}>No hay usuarios registrados</Text>
              </View>
            ) : (
              users.map((u) => (
                <View key={u.id} style={{ backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14, marginBottom: 10 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Text style={{ color: C.text, fontWeight: "700", fontSize: 14 }}>{u.fullName}</Text>
                        <View style={{ backgroundColor: "#3b82f6" + "20", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
                          <Text style={{ color: "#3b82f6", fontSize: 10, fontWeight: "700", textTransform: "capitalize" }}>{u.role || "user"}</Text>
                        </View>
                      </View>
                      <Text style={{ color: C.textSecondary, fontSize: 12, marginTop: 2 }}>📧 {u.email}</Text>
                      <Text style={{ color: C.textSecondary, fontSize: 12 }}>📱 {u.tell || "-"}</Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
                        <View style={{ backgroundColor: u.verified ? "#22c55e" + "20" : "#eab308" + "20", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
                          <Text style={{ color: u.verified ? "#22c55e" : "#eab308", fontSize: 10, fontWeight: "700" }}>{u.verified ? "Activo" : "Sin verificar"}</Text>
                        </View>
                        <Text style={{ color: C.textSecondary, fontSize: 11 }}>{new Date(u.memberSince).toLocaleDateString("es-CO")}</Text>
                      </View>
                    </View>
                    <TouchableOpacity style={{ backgroundColor: C.error, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }} onPress={() => setDeleteConfirm(u.id)}>
                      <Text style={{ color: "#fff", fontWeight: "700", fontSize: 11 }}>Eliminar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </>
        )}

        {activeTab === "pqrs" && (
          <>
            <Text style={{ color: C.text, fontSize: 18, fontWeight: "800", marginBottom: 12 }}>PQRS recibidas ({pqrsList.length})</Text>
            {pqrsList.length === 0 ? (
              <View style={{ backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 24, alignItems: "center" }}>
                <Text style={{ fontSize: 34, marginBottom: 8 }}>📋</Text>
                <Text style={{ color: C.text, fontWeight: "700", fontSize: 16 }}>No hay PQRS registradas</Text>
                <Text style={{ color: C.textSecondary, fontSize: 13, textAlign: "center", marginTop: 4 }}>Las peticiones, quejas y reclamos aparecerán aquí</Text>
              </View>
            ) : (
              pqrsList.map((item) => (
                <View key={item.id} style={{ backgroundColor: C.bgCard, borderWidth: 1, borderColor: item.status === "resolved" ? "#22c55e" + "40" : C.border, borderRadius: 12, padding: 14, marginBottom: 10 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                    <View style={{ backgroundColor: pqrsTypeColor(item.type) + "20", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
                      <Text style={{ color: pqrsTypeColor(item.type), fontSize: 10, fontWeight: "700" }}>{pqrsTypeLabel(item.type)}</Text>
                    </View>
                    <View style={{ backgroundColor: item.status === "pending" ? "#eab308" + "20" : "#22c55e" + "20", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
                      <Text style={{ color: item.status === "pending" ? "#eab308" : "#22c55e", fontSize: 10, fontWeight: "700" }}>{item.status === "pending" ? "Pendiente" : "Resuelta"}</Text>
                    </View>
                    <View style={{ backgroundColor: C.btnSecondary, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
                      <Text style={{ color: C.textSecondary, fontSize: 10, fontWeight: "700", textTransform: "capitalize" }}>{item.user_role === "empresa" ? "Empresa" : "Usuario"}</Text>
                    </View>
                  </View>
                  <Text style={{ color: C.text, fontWeight: "700", fontSize: 14, marginBottom: 4 }}>{item.subject}</Text>
                  <Text numberOfLines={2} style={{ color: C.textSecondary, fontSize: 12, marginBottom: 6 }}>{item.description}</Text>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={{ color: C.textSecondary, fontSize: 11 }}>{item.user_name} · {new Date(item.created_at).toLocaleDateString("es-CO")}</Text>
                    {item.status === "pending" && (
                      <TouchableOpacity style={{ backgroundColor: C.btnPrimary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }} onPress={() => handleResolvePQRS(item.id)} disabled={actionLoading === item.id}>
                        {actionLoading === item.id ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "700", fontSize: 11 }}>Marcar resuelta</Text>}
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      {deleteConfirm && (
        <View style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: 20, zIndex: 30 }}>
          <View style={{ backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.error, borderRadius: 16, padding: 24, alignItems: "center" }}>
            <Text style={{ fontSize: 34, marginBottom: 8 }}>⚠️</Text>
            <Text style={{ color: C.text, fontSize: 18, fontWeight: "800", marginBottom: 4 }}>¿Eliminar usuario?</Text>
            <Text style={{ color: C.textSecondary, fontSize: 13, textAlign: "center", marginBottom: 16 }}>Esta acción no se puede deshacer. Se eliminarán también sus direcciones, pedidos y tokens.</Text>
            <View style={{ flexDirection: "row", gap: 8, width: "100%" }}>
              <View style={{ flex: 1 }}><Button title="Cancelar" variant="secondary" onPress={() => setDeleteConfirm(null)} /></View>
              <View style={{ flex: 1 }}><Button title="Eliminar" onPress={() => handleDeleteUser(deleteConfirm)} loading={actionLoading === deleteConfirm} style={{ backgroundColor: C.error }} /></View>
            </View>
          </View>
        </View>
      )}
    </Screen>
  );
}
