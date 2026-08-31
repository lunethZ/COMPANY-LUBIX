export type Category = {
  id: string;
  name: string;
  product_count: number;
};

export interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
  descripcion: string;
  stock: number;
  discount_enable: boolean;
  discount_value: number;
  company_id: string;
  company_name: string;
  technical_spec:
    | Array<{ label: string; value: string }>
    | Record<string, unknown>
    | null;
  catalog_id: string | null;
  catalog_name: string | null;
  avg_rating: number;
  review_count: number;
}

export interface ProductReview {
  id: string;
  rating: number;
  title: string | null;
  comment: string;
  created_at: string;
  user_name: string;
}

export function effectivePrice(product: Pick<Product, "price" | "discount_enable" | "discount_value">): number {
  if (product.discount_enable && product.discount_value > 0) {
    return product.price - (product.price * product.discount_value) / 100;
  }
  return product.price;
}

export function discountPercent(product: Pick<Product, "price" | "discount_enable" | "discount_value">): number {
  if (product.discount_enable && product.discount_value > 0) {
    return Number(product.discount_value);
  }
  return 0;
}

export function specList(
  technical_spec: Product["technical_spec"]
): Array<{ label: string; value: string }> {
  if (!technical_spec) return [];
  if (Array.isArray(technical_spec)) return technical_spec;
  return Object.entries(technical_spec).map(([label, value]) => ({
    label,
    value: String(value),
  }));
}