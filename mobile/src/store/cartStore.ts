import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CartItem } from "../types/cart";

const CART_KEY = "cart";

export const cartStore = {
  async get(): Promise<CartItem[]> {
    try {
      const raw = await AsyncStorage.getItem(CART_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  },
  async set(cart: CartItem[]): Promise<void> {
    try {
      await AsyncStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {
      // ignore
    }
  },
  async add(item: CartItem): Promise<CartItem[]> {
    const cart = await this.get();
    const existing = cart.find((c) => c.product_id === item.product_id);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      cart.push(item);
    }
    await this.set(cart);
    return cart;
  },
  async updateQuantity(productId: string, delta: number): Promise<CartItem[]> {
    const cart = await this.get();
    const updated = cart.map((i) =>
      i.product_id === productId
        ? { ...i, quantity: Math.max(1, i.quantity + delta) }
        : i
    );
    await this.set(updated);
    return updated;
  },
  async remove(productId: string): Promise<CartItem[]> {
    const cart = await this.get();
    const updated = cart.filter((i) => i.product_id !== productId);
    await this.set(updated);
    return updated;
  },
  async clear(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CART_KEY);
    } catch {
      // ignore
    }
  },
};