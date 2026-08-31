import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "../context/ThemeContext";
import { CheckoutProvider } from "../context/CheckoutContext";
import ResumenScreen from "../screens/checkout/ResumenOrden";
import DireccionScreen from "../screens/checkout/DireccionEnvio";
import PagoScreen from "../screens/checkout/MetodoPago";
import ConfirmacionScreen from "../screens/checkout/ConfirmacionOrden";
import type { CheckoutStackParamList } from "./types";

const Stack = createNativeStackNavigator<CheckoutStackParamList>();

export default function CheckoutStack() {
  const { C } = useTheme();

  return (
    <CheckoutProvider>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: C.bg },
        }}
      >
        <Stack.Screen name="Resumen" component={ResumenScreen} />
        <Stack.Screen name="Direccion" component={DireccionScreen} />
        <Stack.Screen name="Pago" component={PagoScreen} />
        <Stack.Screen name="Confirmacion" component={ConfirmacionScreen} />
      </Stack.Navigator>
    </CheckoutProvider>
  );
}