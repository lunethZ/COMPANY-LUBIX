import React, { useState } from "react";
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Field, Button, Popup, Screen, StrengthBar } from "../components/ui";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "../context/ThemeContext";
import api from "../api/axios";
import axios from "axios";
import type { RootStackParamList } from "../navigation/types";
import { errorDetailMessage } from "../utils/errors";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, "NewPassword">;

export default function NewPasswordScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { C } = useTheme();
  const [email, setEmail] = useState(route.params?.email || "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const strength = [hasMinLength, hasUpper, hasLower, hasNumber].filter(Boolean).length;
  const isPasswordValid = strength === 4;

  const showMessage = (msg: string, type: "success" | "error") => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 3000);
  };

  const handleSubmit = async () => {
    if (!email.trim() || code.length < 1) {
      showMessage("Completa el email y el código", "error");
      return;
    }
    if (!isPasswordValid) {
      showMessage("La contraseña no es segura", "error");
      return;
    }
    if (password !== confirmPassword) {
      showMessage("Las contraseñas no coinciden", "error");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/reset-password-user", {
        email: email.trim(),
        code,
        new_password: password,
      });
      showMessage("Contraseña restablecida", "success");
      setTimeout(() => navigation.replace("Login"), 1200);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        showMessage(errorDetailMessage(error, "No se pudo restablecer"), "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const requirement = (ok: boolean, label: string) => (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
      {ok ? <Ionicons name="checkmark-circle" size={14} color={C.accent} /> : null}
      <Text style={{ color: ok ? C.accent : C.textSecondary, fontSize: 12, fontWeight: ok ? "600" : "400" }}>
        {label}
      </Text>
    </View>
  );

  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 20 }}>
          {message ? <Popup message={message} type={messageType as "success" | "error"} /> : null}

          <View style={{ alignItems: "center", marginBottom: 24 }}>
            <Text style={{ color: C.accent, fontSize: 40, fontWeight: "900", marginBottom: 4 }}>
              Lubix
            </Text>
            <Text style={{ color: C.textSecondary, fontSize: 14, fontWeight: "300" }}>
              Nueva contraseña
            </Text>
          </View>

          <Field
            label="Email *"
            value={email}
            onChangeText={setEmail}
            placeholder="tu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Field
            label="Código *"
            value={code}
            onChangeText={(v) => setCode(v.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            keyboardType="number-pad"
          />
          <View style={{ marginBottom: 14 }}>
            <Field
              label="Nueva contraseña *"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
            />
            {password ? (
              <View style={{ marginTop: 6 }}>
                <StrengthBar strength={strength} />
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
                  {requirement(hasMinLength, "8+ chars")}
                  {requirement(hasUpper, "Mayús")}
                  {requirement(hasLower, "Minús")}
                  {requirement(hasNumber, "Número")}
                </View>
              </View>
            ) : null}
          </View>
          <Field
            label="Confirmar contraseña *"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="••••••••"
            secureTextEntry
          />

          <Button title="Restablecer" onPress={handleSubmit} loading={loading} disabled={!isPasswordValid} />

          <Text style={{ textAlign: "center", color: C.textSecondary, fontSize: 13, marginTop: 16 }}>
            ¿Cambiaste de opinión?{" "}
            <Text
              style={{ color: C.accent, fontWeight: "600" }}
              onPress={() => navigation.navigate("Login")}
            >
              Inicia sesión
            </Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}