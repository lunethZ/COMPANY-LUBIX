import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { Screen, Popup } from "../components/ui";
import AppHeader from "../components/AppHeader";
import { useTheme } from "../context/ThemeContext";
import api from "../api/axios";
import axios from "axios";
import { errorDetailMessage } from "../utils/errors";

type Module = "Inventario" | "Base de Datos" | "Ventas" | "Usuarios";
type Filter = Module | "Todos";

interface Log {
  user: string;
  action: string;
  module: Module;
  time: string;
  status: "ok" | "warn";
}

interface CompanyPending {
  id: string | number;
  companyName: string;
  companyNIT: string;
  email: string;
}

const logs: Log[] = [
  { user: "admin", action: "Actualizó precios", module: "Inventario", time: "10:30", status: "ok" },
  { user: "root", action: "Eliminó cuenta", module: "Usuarios", time: "10:12", status: "ok" },
  { user: "sistemas", action: "Backup completado", module: "Base de Datos", time: "09:58", status: "ok" },
  { user: "admin", action: "Reembolso realizado", module: "Ventas", time: "09:40", status: "warn" },
  { user: "root", action: "Configuración de seguridad", module: "Usuarios", time: "09:15", status: "ok" },
];

const kpis = [
  { value: "$45.2M", label: "Ingresos Totales" },
  { value: "$12.8M", label: "Gastos Operativos" },
  { value: "71.6%", label: "Margen de Ganancia" },
  { value: "1.2K", label: "Nuevos Clientes" },
];

const MODULES: Filter[] = ["Todos", "Inventario", "Base de Datos", "Ventas", "Usuarios"];

export default function DashboardAdminScreen() {
  const { C } = useTheme();
  const [filtro, setFiltro] = useState<Filter>("Todos");
  
  // Estados para controlar empresas pendientes
  const [pendingCompanies, setPendingCompanies] = useState<CompanyPending[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | number | null>(null);
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"success" | "error" | "">("");

  const showPopup = (msg: string, t: "success" | "error") => {
    setMessage(msg);
    setType(t);
    setTimeout(() => {
      setMessage("");
      setType("");
    }, 3000);
  };

  const fetchPendingCompanies = async () => {
    setLoadingCompanies(true);
    try {
      const response = await api.get("/admin/pending-companies");
      setPendingCompanies(response.data);
    } catch (error) {
      console.log("Error consultando empresas pendientes:", error);
    } finally {
      setLoadingCompanies(false);
    }
  };

  useEffect(() => {
    fetchPendingCompanies();
  }, []);

  const handleApprove = async (id: string | number) => {
    setActionLoading(id);
    try {
      await api.post(`/admin/approve-company/${id}`);
      showPopup("Empresa autorizada correctamente", "success");
      setPendingCompanies((prev) => prev.filter((c) => c.id !== id));
    } catch (error) {
      if (axios.isAxiosError(error)) {
        showPopup(errorDetailMessage(error, "Error al autorizar empresa"), "error");
      } else {
        showPopup("Error desconocido", "error");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = filtro === "Todos" ? logs : logs.filter((l) => l.module === filtro);

  return (
    <Screen>
      <AppHeader role="admin" />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {message ? <Popup message={message} type={type as "success" | "error"} /> : null}

        <Text style={{ color: C.text, fontSize: 22, fontWeight: "800", marginBottom: 16 }}>
          Panel de Administración General
        </Text>

        {/* INDICADOR DE PRUEBA */}
        <Text style={{ color: "red", fontSize: 22, fontWeight: "bold", textAlign: "center", marginBottom: 10 }}>
          PROBANDO CAMBIOS EN VIVO
        </Text>

        {/* SECCIÓN NUEVA: APROBACIÓN DE EMPRESAS */}
        <Text style={{ color: C.text, fontSize: 18, fontWeight: "800", marginBottom: 10 }}>
          Aprobar Empresas
        </Text>
        <View style={{ backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14, marginBottom: 20 }}>
          {loadingCompanies ? (
            <ActivityIndicator size="small" color={C.accent} />
          ) : pendingCompanies.length === 0 ? (
            <Text style={{ color: C.textSecondary, fontSize: 13, textAlign: "center" }}>
              No hay empresas pendientes de autorización
            </Text>
          ) : (
            pendingCompanies.map((comp) => (
              <View
                key={comp.id}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingVertical: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: C.border,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ color: C.text, fontWeight: "700", fontSize: 14 }}>{comp.companyName}</Text>
                  <Text style={{ color: C.textSecondary, fontSize: 12 }}>NIT: {comp.companyNIT}</Text>
                  <Text style={{ color: C.textSecondary, fontSize: 11 }}>{comp.email}</Text>
                </View>
                <TouchableOpacity
                  style={{
                    backgroundColor: C.btnPrimary,
                    borderRadius: 8,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                  }}
                  onPress={() => handleApprove(comp.id)}
                  disabled={actionLoading === comp.id}
                >
                  {actionLoading === comp.id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>Aprobar</Text>
                  )}
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 16 }}>
          {kpis.map((k) => (
            <View
              key={k.label}
              style={{ width: "48%", backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14, marginBottom: 10 }}
            >
              <Text style={{ color: C.accent, fontSize: 18, fontWeight: "800" }}>{k.value}</Text>
              <Text style={{ color: C.textSecondary, fontSize: 11 }}>{k.label}</Text>
            </View>
          ))}
        </View>

        <Text style={{ color: C.text, fontSize: 18, fontWeight: "800", marginBottom: 10 }}>
          Tendencia de Ingresos Mensuales
        </Text>
        <View style={{ backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 16, marginBottom: 20 }}>
          {["Ene", "Feb", "Mar", "Abr", "May", "Jun"].map((m, i) => (
            <View key={m} style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
              <Text style={{ color: C.textSecondary, fontSize: 11, width: 40 }}>{m}</Text>
              <View style={{ flex: 1, height: 12, backgroundColor: C.bgSecondary, borderRadius: 6, overflow: "hidden" }}>
                <View style={{ width: `${(i + 3) * 8}%`, height: 12, backgroundColor: C.accent }} />
              </View>
            </View>
          ))}
        </View>

        <Text style={{ color: C.text, fontSize: 18, fontWeight: "800", marginBottom: 10 }}>
          Auditoría del Sistema
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          {MODULES.map((m) => (
            <TouchableOpacity
              key={m}
              style={{ backgroundColor: filtro === m ? C.btnPrimary : C.btnSecondary, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 }}
              onPress={() => setFiltro(m)}
            >
              <Text style={{ color: filtro === m ? "#fff" : C.text, fontWeight: "600", fontSize: 12 }}>{m}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {filtered.map((l, i) => (
          <View
            key={i}
            style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 12, marginBottom: 8 }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.text, fontWeight: "600", fontSize: 13 }}>{l.user}</Text>
              <Text style={{ color: C.textSecondary, fontSize: 12 }}>{l.action}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ color: l.status === "ok" ? C.accent : "#f59e0b", fontSize: 11, fontWeight: "700" }}>{l.module}</Text>
              <Text style={{ color: C.textSecondary, fontSize: 11 }}>{l.time}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}