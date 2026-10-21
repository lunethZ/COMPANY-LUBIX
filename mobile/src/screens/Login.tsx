import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Field, Button, Popup, Screen } from "../components/ui";
import { useTheme } from "../context/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import axios from "axios";
import type { LoginResponse } from "../types/auth";
import type { RootStackParamList } from "../navigation/types";
import { errorDetailMessage } from "../utils/errors";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const { C } = useTheme();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState<"user" | "company">("user");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  const showMessage = (msg: string, type: "success" | "error") => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 3000);
  };

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      showMessage("Completa todos los campos", "error");
      return;
    }
    setLoading(true);
    try {
      const payload = { email: email.trim(), password };
      const endpoint = userType === "company" ? "/auth/login-company" : "/auth/login-user";
      const response = await api.post<LoginResponse>(endpoint, payload);
      const data = response.data;

      if (!data.access_token) {
        showMessage(data.message || "Cuenta no verificada. Revisa tu correo.", "error");
        return;
      }

      const mappedRole =
        data.role === "company" ? "empresa" : data.role === "admin" ? "admin" : "user";

      login(data.access_token, data.refresh_token, {
        id: data.id as string,
        name: data.Nombre || "",
        email: data.email || "",
        role_id: mappedRole,
      });

      api.defaults.headers.common.Authorization = `Bearer ${data.access_token}`;

      showMessage(`¡Bienvenido ${data.Nombre}!`, "success");
      setTimeout(() => {
        if (mappedRole === "empresa") navigation.replace("DashboardEmpresa");
        else if (mappedRole === "admin") navigation.replace("DashboardAdmin");
        else navigation.replace("Main");
      }, 1000);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        showMessage(errorDetailMessage(error, "Error de login"), "error");
      } else {
        showMessage("Error desconocido", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={{ flex: 1, paddingTop: insets.top }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            padding: 20,
            paddingTop: Math.max(insets.top, 20),
          }}
        >
          {message ? <Popup message={message} type={messageType as "success" | "error"} /> : null}

          <View style={{ alignItems: "center", marginBottom: 24 }}>
            <Text style={{ color: C.accent, fontSize: 40, fontWeight: "900", marginBottom: 4 }}>
              Lubix
            </Text>
            <Text style={{ color: C.textSecondary, fontSize: 14, fontWeight: "300" }}>
              Inicia sesión
            </Text>
          </View>

          <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
            {(["user", "company"] as const).map((option) => (
              <TouchableOpacity
                key={option}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 10,
                  backgroundColor: userType === option ? C.btnPrimary : C.btnSecondary,
                }}
                onPress={() => setUserType(option)}
              >
                <Text
                  style={{
                    textAlign: "center",
                    fontWeight: "600",
                    color: userType === option ? "#fff" : C.text,
                  }}
                >
                  {option === "user" ? "Usuario" : "Empresa"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="tu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />
          <Field
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            editable={!loading}
          />

          <Button title="Iniciar Sesión" onPress={handleSubmit} loading={loading} />

          <View style={{ alignItems: "center", marginTop: 20 }}>
            <Text style={{ color: C.textSecondary, fontSize: 13 }}>
              ¿No tienes cuenta?{" "}
              <Text
                style={{ color: C.accent, fontWeight: "600" }}
                onPress={() => navigation.navigate("Register")}
              >
                Regístrate
              </Text>
            </Text>
            <Text style={{ color: C.textSecondary, fontSize: 13, marginTop: 8 }}>
              ¿Olvidaste tu contraseña?{" "}
              <Text
                style={{ color: C.accent, fontWeight: "600" }}
                onPress={() => navigation.navigate("Recover")}
              >
                Recuperar
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}