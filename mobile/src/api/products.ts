import api from "./axios";
import type { Category, Product, ProductReview } from "../types/product";

export interface SearchParams {
  q?: string;
  categoria?: string;
  orden?: string;
  min?: number;
  max?: number;
}

export const searchProducts = async (params: SearchParams = {}): Promise<Product[]> => {
  const res = await api.get<{ products: Product[] }>("/products/search", { params });
  return res.data.products || [];
};

export const getProduct = async (id: string): Promise<Product> => {
  const res = await api.get<Product>(`/products/${id}`);
  return res.data;
};

export const getProductReviews = async (id: string): Promise<ProductReview[]> => {
  const res = await api.get<ProductReview[]>(`/products/${id}/reviews`);
  return res.data || [];
};

export const postReview = async (
  id: string,
  data: { rating: number; title?: string; comment: string }
): Promise<{ message: string; id: string }> => {
  const res = await api.post<{ message: string; id: string }>(`/products/${id}/reviews`, data);
  return res.data;
};

export const getRelatedProducts = async (id: string): Promise<Product[]> => {
  const res = await api.get<{ products: Product[] }>(`/products/${id}/related`);
  return res.data.products || [];
};

export const getCatalogs = async (): Promise<Category[]> => {
  const res = await api.get<Category[]>("/products/catalogs");
  return res.data || [];
};