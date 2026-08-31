import api from "./axios";
import type {
  Address,
  CreateAddressInput,
  DashboardMe,
  FavoriteItem,
} from "../types/user";
import type { CreateOrderInput, Order } from "../types/order";

export const getDashboardMe = async (): Promise<DashboardMe> => {
  const res = await api.get<DashboardMe>("/user/dashboard/me");
  return res.data;
};

export const getAddresses = async (): Promise<Address[]> => {
  const res = await api.get<Address[]>("/user/addresses");
  return res.data || [];
};

export const createAddress = async (data: CreateAddressInput): Promise<{ id: string; message: string }> => {
  const res = await api.post<{ id: string; message: string }>("/user/addresses", data);
  return res.data;
};

export const deleteAddress = async (id: string): Promise<void> => {
  await api.delete(`/user/addresses/${id}`);
};

export const createOrder = async (data: CreateOrderInput): Promise<{ id: string; message: string; status: string }> => {
  const res = await api.post<{ id: string; message: string; status: string }>("/user/orders", data);
  return res.data;
};

export const getOrders = async (): Promise<Order[]> => {
  const res = await api.get<Order[]>("/user/orders");
  return res.data || [];
};

export const getOrder = async (id: string): Promise<Order> => {
  const res = await api.get<Order>(`/user/orders/${id}`);
  return res.data;
};

export const cancelOrder = async (id: string): Promise<void> => {
  const res = await api.patch<{ message: string }>(`/user/orders/${id}/cancel`);
  void res;
};

export const getFavorites = async (): Promise<FavoriteItem[]> => {
  const res = await api.get<FavoriteItem[]>("/user/favorites");
  return res.data || [];
};

export const toggleFavorite = async (productId: string): Promise<{ is_favorite: boolean }> => {
  const res = await api.post<{ is_favorite: boolean }>(`/user/favorites/${productId}`);
  return res.data;
};