import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Screen } from "../components/ui";
import AppHeader from "../components/AppHeader";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const stats = [
  { value: "12+", label: "Años de experiencia" },
  { value: "500k+", label: "Transacciones" },
  { value: "99.9%", label: "Uptime" },
  { value: "45M+", label: "Fondos gestionados" },
];

const pillars = [
  { icon: "settings", title: "Infraestructura", text: "Tecnología robusta y escalable para tu negocio." },
  { icon: "shield-checkmark", title: "Confianza y Seguridad", text: "Protección de datos y pagos seguros." },
  { icon: "hand-left", title: "Soporte Estratégico", text: "Acompañamiento continuo para crecer." },
];

const projects = [
  { name: "Tienda Online", desc: "Marketing digital" },
  { name: "Gestión de inventario", desc: "Logística" },
  { name: "Pagos seguros", desc: "Finanzas" },
];

export default function HomeEmpresaScreen() {
  const navigation = useNavigation<Nav>();
  const { C } = useTheme();
  const { user } = useAuth();

  return (
    <Screen>
      <AppHeader role="empresa" />
      <ScrollView>
        <View style={{ padding: 20 }}>
          <View style={{ alignItems: "center", paddingVertical: 20 }}>
            <View style={{ backgroundColor: "#4ade80", paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, marginBottom: 12 }}>
              <Text style={{ color: "#000", fontWeight: "700", fontSize: 12 }}>
                {user?.name || "Tu Empresa"}
              </Text>
            </View>
            <Text style={{ color: C.text, fontSize: 28, fontWeight: "800", textAlign: "center", marginBottom: 8 }}>
              Impulsa tu negocio con Lubix
            </Text>
            <Text style={{ color: C.textSecondary, fontSize: 15, textAlign: "center", paddingHorizontal: 20 }}>
              Vende más, llega a más clientes cercanos y gestiona tus pedidos desde una sola plataforma.
            </Text>
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 24 }}>
            {projects.map((p) => (
              <View
                key={p.name}
                style={{ width: "48%", backgroundColor: "#0f172a", borderRadius: 14, padding: 16, marginBottom: 12, alignItems: "center" }}
              >
                <Text style={{ color: "#4ade80", fontSize: 16, fontWeight: "700", textAlign: "center", marginBottom: 4 }}>{p.name}</Text>
                <Text style={{ color: "#94a3b8", fontSize: 12 }}>{p.desc}</Text>
              </View>
            ))}
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 24 }}>
            {stats.map((s) => (
              <View key={s.label} style={{ width: "48%", backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 16, marginBottom: 12, alignItems: "center" }}>
                <Text style={{ color: C.accent, fontSize: 24, fontWeight: "800" }}>{s.value}</Text>
                <Text style={{ color: C.textSecondary, fontSize: 12, textAlign: "center" }}>{s.label}</Text>
              </View>
            ))}
          </View>

          <Text style={{ color: C.text, fontSize: 20, fontWeight: "800", marginBottom: 12 }}>
            Diferenciales que sostienen tu éxito
          </Text>
          {pillars.map((p) => (
            <View key={p.title} style={{ backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 18, marginBottom: 12 }}>
              <Ionicons name={p.icon as keyof typeof Ionicons.glyphMap} size={26} color={C.accent} />
              <Text style={{ color: C.accent, fontSize: 17, fontWeight: "700", marginBottom: 4 }}>{p.title}</Text>
              <Text style={{ color: C.textSecondary, fontSize: 14 }}>{p.text}</Text>
            </View>
          ))}

          <TouchableOpacity
            style={{ backgroundColor: C.btnPrimary, paddingVertical: 14, borderRadius: 999, alignItems: "center", marginBottom: 20 }}
            onPress={() => navigation.navigate("DashboardEmpresa")}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>Ir al Dashboard</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Screen>
  );
}