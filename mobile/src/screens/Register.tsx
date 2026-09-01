import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Field, Button, Popup, Screen, StrengthBar } from "../components/ui";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import api from "../api/axios";
import axios from "axios";
import type { RootStackParamList } from "../navigation/types";
import { errorDetailMessage } from "../utils/errors";

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Mode = "usuario" | "empresa";

export default function RegisterScreen() {
  const navigation = useNavigation<Nav>();
  const { C } = useTheme();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>("usuario");

  const [form, setForm] = useState({
    name: "",
    surname: "",
    email: "",
    tell: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    nit: "",
    nitDV: "",
    address: "",
    sector: "",
  });

  const [message, setMessage] = useState("");
  const [type, setType] = useState<"success" | "error" | "">("");
  const [loading, setLoading] = useState(false);

  const password = form.password;
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const strength = [hasMinLength, hasUpper, hasLower, hasNumber].filter(Boolean).length;
  const isPasswordValid = strength === 4;

  const showPopup = (msg: string, t: "success" | "error") => {
    setMessage(msg);
    setType(t);
    setTimeout(() => {
      setMessage("");
      setType("");
    }, 3000);
  };

  const setField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleRegister = async () => {
    if (form.password !== form.confirmPassword) {
      showPopup("Las contraseñas no coinciden", "error");
      return;
    }
    if (!isPasswordValid) {
      showPopup("La contraseña no es segura", "error");
      return;
    }
    if (mode === "empresa") {
      if (!form.companyName.trim() || !form.nit.trim() || !form.address.trim()) {
        showPopup("Completa los datos de la empresa", "error");
        return;
      }
    } else if (!form.surname.trim()) {
      showPopup("Completa tu apellido", "error");
      return;
    }

    setLoading(true);
    try {
      let response;
      if (mode === "empresa") {
        const formData = new FormData();
        formData.append("fullName", `${form.name} ${form.surname}`.trim());
        formData.append("email", form.email);
        formData.append("password", form.password);
        formData.append("tell", form.tell);
        formData.append("companyName", form.companyName);
        formData.append("companyAddress", form.address);
        formData.append("companyNIT", form.nit);
        formData.append("companyNITDV", form.nitDV || "0");

        const dummyFile = {
          uri: "data:text/plain;base64,SGVsbG8=",
          name: "certificate.txt",
          type: "text/plain",
        };
        formData.append("certificate", dummyFile as any);

        response = await api.post("/auth/register-company", formData, {
          headers: { 
            "Content-Type": "multipart/form-data" 
          },
        });
        showPopup("Empresa registrada correctamente", "success");
      } else {
        const payload = {
          fullName: `${form.name} ${form.surname}`.trim(),
          email: form.email,
          password: form.password,
          tell: form.tell,
          isActive: true,
          verified: false,
        };

        response = await api.post("/auth/register-user", payload);
        showPopup("Usuario registrado correctamente", "success");
      }

      // Si el backend entrega token en la respuesta de registro, lo guardamos para evitar el 401
      const token = response.data?.access_token || response.data?.token;
      if (token) {
        await AsyncStorage.setItem("token", token);
      }

      setTimeout(() => {
        if (mode === "empresa") {
          navigation.replace("Login");
        } else {
          navigation.replace("Verification", { email: form.email });
        }
      }, 2000);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        showPopup(
          errorDetailMessage(
            error,
            mode === "empresa" ? "No se pudo registrar la empresa" : "Error al registrar"
          ),
          "error"
        );
      } else {
        showPopup("Error desconocido", "error");
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
      <KeyboardAvoidingView
        style={{ flex: 1, paddingTop: insets.top }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            padding: 20,
            paddingTop: Math.max(insets.top, 20),
            paddingBottom: 40 + insets.bottom,
          }}
        >
          {message ? <Popup message={message} type={type as "success" | "error"} /> : null}

          <View style={{ alignItems: "center", marginBottom: 20 }}>
            <Text style={{ color: C.accent, fontSize: 40, fontWeight: "900", marginBottom: 4 }}>
              Lubix
            </Text>
            <Text style={{ color: C.textSecondary, fontSize: 14, fontWeight: "300" }}>
              {mode === "empresa" ? "Registra tu empresa" : "Crea tu cuenta gratis"}
            </Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              borderRadius: 12,
              borderWidth: 1,
              borderColor: C.border,
              backgroundColor: C.bgSecondary,
              padding: 4,
              marginBottom: 20,
            }}
          >
            {(["usuario", "empresa"] as Mode[]).map((option) => (
              <TouchableOpacity
                key={option}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: mode === option ? C.btnPrimary : "transparent",
                }}
                onPress={() => setMode(option)}
              >
                <Text
                  style={{
                    textAlign: "center",
                    fontWeight: "600",
                    color: mode === option ? "#fff" : C.text,
                  }}
                >
                  {option === "usuario" ? "Usuario" : "Empresa"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Field
            label={mode === "empresa" ? "Nombre contacto *" : "Nombre *"}
            value={form.name}
            onChangeText={(v) => setField("name", v)}
            placeholder={mode === "empresa" ? "Nombre de contacto" : "Su Nombre"}
          />
          {mode === "usuario" && (
            <Field
              label="Apellido *"
              value={form.surname}
              onChangeText={(v) => setField("surname", v)}
              placeholder="Su Apellido"
            />
          )}
          <Field
            label="Email *"
            value={form.email}
            onChangeText={(v) => setField("email", v)}
            placeholder="tu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Field
            label="Teléfono *"
            value={form.tell}
            onChangeText={(v) => setField("tell", v)}
            placeholder="+57 300 123 4567"
            keyboardType="phone-pad"
          />

          <View style={{ marginBottom: 14 }}>
            <Field
              label="Contraseña *"
              value={form.password}
              onChangeText={(v) => setField("password", v)}
              placeholder="••••••••"
              secureTextEntry
            />
            {form.password ? (
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
            value={form.confirmPassword}
            onChangeText={(v) => setField("confirmPassword", v)}
            placeholder="••••••••"
            secureTextEntry
          />

          {mode === "empresa" && (
            <>
              <Field
                label="Nombre de la empresa *"
                value={form.companyName}
                onChangeText={(v) => setField("companyName", v)}
                placeholder="Lubix S.A.S"
              />
              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 2 }}>
                  <Field
                    label="NIT *"
                    value={form.nit}
                    onChangeText={(v) => setField("nit", v)}
                    placeholder="900123456"
                    keyboardType="number-pad"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Field
                    label="DV *"
                    value={form.nitDV}
                    onChangeText={(v) => setField("nitDV", v)}
                    placeholder="7"
                    keyboardType="number-pad"
                    maxLength={1}
                  />
                </View>
              </View>
              <Field
                label="Dirección *"
                value={form.address}
                onChangeText={(v) => setField("address", v)}
                placeholder="Calle 123 #45-67"
              />
            </>
          )}

          <Button
            title={
              loading
                ? mode === "empresa"
                  ? "Registrando empresa..."
                  : "Creando cuenta..."
                : mode === "empresa"
                ? "Registrar empresa"
                : "Crear cuenta"
            }
            onPress={handleRegister}
            loading={loading}
            disabled={!isPasswordValid}
          />

          <Text style={{ textAlign: "center", color: C.textSecondary, fontSize: 13, marginTop: 16 }}>
            ¿Ya tienes cuenta?{" "}
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