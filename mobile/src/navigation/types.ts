import type { NavigatorScreenParams } from "@react-navigation/native";

export type MainTabParamList = {
  Inicio: undefined;
  Buscar: { q?: string; categoria?: string } | undefined;
  Categorias: undefined;
  Carrito: undefined;
  Perfil: undefined;
};

export type CheckoutStackParamList = {
  Resumen: undefined;
  Direccion: undefined;
  Pago: undefined;
  Confirmacion: { orderId: string };
};

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Recover: undefined;
  Verification: { email: string } | undefined;
  NewPassword: { email: string } | undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  ProductoDetalle: { id: string };
  Checkout: undefined;
  HomeEmpresa: undefined;
  DashboardEmpresa: undefined;
  DashboardAdmin: undefined;
  DashboardUsuario: undefined;
};