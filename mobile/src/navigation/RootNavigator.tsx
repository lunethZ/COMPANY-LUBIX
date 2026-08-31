import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "../context/ThemeContext";
import LoginScreen from "../screens/Login";
import RegisterScreen from "../screens/Register";
import RecoverPasswordScreen from "../screens/RecoverPassword";
import VerificationCodeScreen from "../screens/VerificationCode";
import NewPasswordScreen from "../screens/NewPassword";
import MainTabs from "./MainTabs";
import CheckoutStack from "./CheckoutStack";
import ProductoDetalleScreen from "../screens/ProductoDetalle";
import HomeEmpresaScreen from "../screens/HomeEmpresa";
import DashboardEmpresaScreen from "../screens/DashboardEmpresa";
import DashboardAdminScreen from "../screens/DashboardAdmin";
import DashboardUsuarioScreen from "../screens/DashboardUsuario";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { C } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        contentStyle: { backgroundColor: C.bg },
      }}
    >
      <Stack.Group>
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Recover" component={RecoverPasswordScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Verification" component={VerificationCodeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="NewPassword" component={NewPasswordScreen} options={{ headerShown: false }} />
      </Stack.Group>
      <Stack.Group>
        <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen
          name="ProductoDetalle"
          component={ProductoDetalleScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="Checkout" component={CheckoutStack} options={{ headerShown: false }} />
      </Stack.Group>
      <Stack.Group>
        <Stack.Screen name="HomeEmpresa" component={HomeEmpresaScreen} options={{ headerShown: false }} />
        <Stack.Screen name="DashboardEmpresa" component={DashboardEmpresaScreen} options={{ headerShown: false }} />
        <Stack.Screen name="DashboardAdmin" component={DashboardAdminScreen} options={{ headerShown: false }} />
        <Stack.Screen name="DashboardUsuario" component={DashboardUsuarioScreen} options={{ headerShown: false }} />
      </Stack.Group>
    </Stack.Navigator>
  );
}