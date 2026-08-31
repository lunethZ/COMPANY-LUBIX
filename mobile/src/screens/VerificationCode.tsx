import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Button, Popup, Screen, Field } from "../components/ui";
import { useTheme } from "../context/ThemeContext";
import api from "../api/axios";
import axios from "axios";
import type { RootStackParamList } from "../navigation/types";
import { errorDetailMessage } from "../utils/errors";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, "Verification">;

export default function VerificationCodeScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { C } = useTheme();
  const [email, setEmail] = useState(route.params?.email || "");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
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

  const setDigit = (index: number, value: string) => {
    const clean = value.replace(/\D/g, "");
    const next = [...code];
    next[index] = clean.slice(-1);
    setCode(next);
  };

  const handleVerify = async () => {
    const fullCode = code.join("");
    if (!email.trim() || fullCode.length < 6) {
      showMessage("Ingresa el email y el código de 6 dígitos", "error");
      return;
    }
    setLoading(true);
    try {
      const response = await api.post("/auth/verify-email-user", {
        email: email.trim(),
        code: fullCode,
      });
      showMessage("Email verificado correctamente", "success");
      setTimeout(() => navigation.replace("Login"), 1200);
      return response;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        showMessage(errorDetailMessage(error, "Código incorrecto"), "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      showMessage("Ingresa tu email", "error");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/verify-email-user", { email: email.trim(), code: "000000" });
      showMessage("Código reenviado a tu correo", "success");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        showMessage(errorDetailMessage(error, "No se pudo reenviar"), "error");
      }
    } finally {
      setLoading(false);
    }
  };

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
              Verifica tu email
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

          <Text style={{ color: C.textSecondary, fontSize: 13, marginBottom: 10, fontWeight: "600" }}>
            Código de verificación *
          </Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 14 }}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                value={digit}
                onChangeText={(v) => setDigit(index, v)}
                keyboardType="number-pad"
                maxLength={1}
                style={[
                  styles.otp,
                  {
                    backgroundColor: C.inputBg,
                    borderColor: C.inputBorder,
                    color: C.text,
                  },
                ]}
              />
            ))}
          </View>
          <Text style={{ color: C.textSecondary, fontSize: 12, marginBottom: 4 }}>
            Ctrl+V para pegar el código
          </Text>

          <Button title="Verificar" onPress={handleVerify} loading={loading} />

          <TouchableOpacity onPress={handleResend} style={{ marginTop: 12 }}>
            <Text style={{ textAlign: "center", color: C.accent, fontWeight: "600" }}>
              Reenviar código
            </Text>
          </TouchableOpacity>

          <Text style={{ textAlign: "center", color: C.textSecondary, fontSize: 13, marginTop: 16 }}>
            ¿Cambiar email?{" "}
            <Text
              style={{ color: C.accent, fontWeight: "600" }}
              onPress={() => navigation.navigate("Register")}
            >
              Volver al registro
            </Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  otp: {
    width: 46,
    height: 52,
    borderRadius: 10,
    borderWidth: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
  },
});