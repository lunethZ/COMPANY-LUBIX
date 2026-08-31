import React, { useState } from "react";
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Field, Button, Popup, Screen } from "../components/ui";
import { useTheme } from "../context/ThemeContext";
import api from "../api/axios";
import axios from "axios";
import type { RootStackParamList } from "../navigation/types";
import { errorDetailMessage } from "../utils/errors";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function RecoverPasswordScreen() {
  const navigation = useNavigation<Nav>();
  const { C } = useTheme();
  const [email, setEmail] = useState("");
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
    if (!email.trim()) {
      showMessage("Ingresa tu email", "error");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/forgot-password-user", { email: email.trim() });
      showMessage("Código enviado a tu correo", "success");
      setTimeout(() => navigation.replace("NewPassword", { email: email.trim() }), 1000);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        showMessage(errorDetailMessage(error, "Error al enviar el código"), "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 20 }}>
          {message ? <Popup message={message} type={messageType as "success" | "error"} /> : null}

          <View style={{ alignItems: "center", marginBottom: 24 }}>
            <Text style={{ color: C.accent, fontSize: 40, fontWeight: "900", marginBottom: 4 }}>
              Lubix
            </Text>
            <Text style={{ color: C.textSecondary, fontSize: 14, fontWeight: "300" }}>
              Recuperar contraseña
            </Text>
          </View>

          <Field
            label="Email *"
            value={email}
            onChangeText={setEmail}
            placeholder="tu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />

          <Button title="Enviar código" onPress={handleSubmit} loading={loading} />

          <Text style={{ textAlign: "center", color: C.textSecondary, fontSize: 13, marginTop: 16 }}>
            ¿Recordaste tu contraseña?{" "}
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