export interface OrderItem {
  id: string;
  product_id: string | null;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  status: string;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  payment_method: string;
  recipient: string;
  address: string;
  city: string;
  department: string;
  postal_code: string | null;
  created_at: string;
  estimated_delivery: string;
  delivery_progress: number;
  items: OrderItem[];
}

export interface CreateOrderInput {
  items: Array<{
    product_id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  payment_method: string;
  recipient: string;
  address: string;
  city: string;
  department: string;
  postal_code?: string;
}

export type PaymentMethod = "tarjeta" | "pse" | "efectivo";

export const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};