import api from "./axios";
import type { CartResponse } from "../types/cart";

export const getCart = async (): Promise<CartResponse> => {
  const res = await api.get<CartResponse>("/cart");
  return res.data;
};

export const addCartItem = async (productId: string, quantity = 1): Promise<CartResponse> => {
  const res = await api.post<{ message: string; item: unknown }>("/cart/items", {
    product_id: productId,
    quantity,
  });
  void res;
  return getCart();
};

export const setCartItemQuantity = async (productId: string, quantity: number): Promise<CartResponse> => {
  const res = await api.patch<{ message: string }>(`/cart/items/${productId}`, { quantity });
  void res;
  return getCart();
};

export const removeCartItem = async (productId: string): Promise<CartResponse> => {
  const res = await api.delete<{ message: string }>(`/cart/items/${productId}`);
  void res;
  return getCart();
};

export const clearCart = async (): Promise<void> => {
  const res = await api.delete<{ message: string }>("/cart");
  void res;
};

export const mergeCart = async (items: Array<{ product_id: string; quantity: number }>): Promise<CartResponse> => {
  const res = await api.post<CartResponse>("/cart/merge", { items });
  return res.data;
};