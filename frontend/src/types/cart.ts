export interface CartItem {
  id: string;
  product_id: string;
  name: string;
  price: number;
  discount_enable: boolean;
  discount_value: number;
  unit_price: number;
  image: string;
  stock: number;
  quantity: number;
  line_total: number;
}

export interface CartResponse {
  items: CartItem[];
  subtotal: number;
  total_items: number;
}