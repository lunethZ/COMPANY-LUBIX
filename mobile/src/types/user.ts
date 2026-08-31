export type RoleId = "user" | "empresa" | "admin";

export interface DashboardMe {
  fullName: string;
  email: string;
  tell: string;
  memberSince: string;
  role: string;
  totalOrders: number;
  totalSpent: number;
  savedProducts: number;
  addresses: number;
}

export interface Address {
  id: string;
  label: string | null;
  address: string;
  city: string;
  department: string;
  postal_code: string | null;
  is_default: boolean;
}

export interface CreateAddressInput {
  label?: string;
  address: string;
  city: string;
  department: string;
  postal_code?: string;
  is_default: boolean;
}

export interface FavoriteItem {
  id: string;
  product: ProductLite;
  created_at: string;
}

export interface ProductLite {
  id: string;
  name: string;
  price: number;
  images: string[];
  descripcion: string;
  stock: number;
  discount_enable: boolean;
  discount_value: number;
  company_name: string;
}