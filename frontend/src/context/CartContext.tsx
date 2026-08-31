import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import type { ReactNode } from "react";
import { useAuth } from "./AuthContext";
import * as cartApi from "../api/cart";
import type { CartItem } from "../types/cart";
import { errorDetailMessage } from "../utils/errors";

export interface CartProductInput {
  id: string | number;
  name: string;
  price: number;
  image?: string;
  stock?: number;
}

function readLocal(): CartItem[] {
  try {
    const raw = localStorage.getItem("cart");
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((rawItem: any) => {
      const productId = String(rawItem.product_id ?? rawItem.id);
      const quantity = Math.max(1, Number(rawItem.quantity ?? 1));
      const unitPrice = Number(rawItem.unit_price ?? rawItem.price ?? 0);
      return {
        id: rawItem.id != null ? String(rawItem.id) : productId,
        product_id: productId,
        name: String(rawItem.name || ""),
        price: Number(rawItem.price ?? 0),
        discount_enable: Boolean(rawItem.discount_enable),
        discount_value: Number(rawItem.discount_value ?? 0),
        unit_price: unitPrice,
        image: rawItem.image ? String(rawItem.image) : "",
        stock: Number(rawItem.stock ?? 0),
        quantity,
        line_total: Number(rawItem.line_total ?? unitPrice * quantity),
      } as CartItem;
    });
  } catch {
    return [];
  }
}

function writeLocal(items: CartItem[]) {
  localStorage.setItem("cart", JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("cart-changed"));
}

function apiErrorMessage(e: unknown): string {
  return errorDetailMessage(e, "");
}

interface CartContextType {
  items: CartItem[];
  subtotal: number;
  totalItems: number;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  addToCart: (product: CartProductInput, quantity?: number) => Promise<void>;
  increment: (productId: string) => Promise<void>;
  decrement: (productId: string) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  emptyCart: () => Promise<void>;
}

export const CartContext = createContext<CartContextType | null>(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const wasAuthed = useRef(isAuthenticated);

  const itemsRef = useRef(items);
  itemsRef.current = items;

  const applyLocal = useCallback((next: CartItem[]) => {
    setItems(next);
    writeLocal(next);
  }, []);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setItems(readLocal());
      return;
    }
    setLoading(true);
    try {
      const cart = await cartApi.getCart();
      setItems(cart.items);
      setError("");
    } catch {
      // keep previous items on network error
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (isAuthenticated) {
        const local = readLocal();
        if (local.length) {
          try {
            await cartApi.mergeCart(
              local.map((i) => ({ product_id: i.product_id, quantity: i.quantity }))
            );
            localStorage.removeItem("cart");
          } catch {
            // backend may be unavailable; fall back to local items
          }
        }
        if (cancelled) return;
        setLoading(true);
        try {
          const cart = await cartApi.getCart();
          if (!cancelled) setItems(cart.items);
        } catch {
          if (!cancelled) setItems(readLocal());
        } finally {
          if (!cancelled) setLoading(false);
        }
      } else {
        if (wasAuthed.current && itemsRef.current.length) {
          writeLocal(itemsRef.current);
        }
        if (cancelled) return;
        setItems(readLocal());
        setLoading(false);
      }
      wasAuthed.current = isAuthenticated;
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const addToCart = useCallback(
    async (product: CartProductInput, quantity = 1) => {
      setError("");
      const productId = String(product.id);

      if (!isAuthenticated) {
        const unitPrice = Number(product.price) || 0;
        const current = readLocal();
        const existing = current.find((c) => c.product_id === productId);
        let next: CartItem[];
        if (existing) {
          const newQty = Math.min(
            existing.quantity + quantity,
            Math.max(1, product.stock ?? existing.stock ?? 999)
          );
          next = current.map((c) =>
            c.product_id === productId
              ? { ...c, quantity: newQty, line_total: c.unit_price * newQty }
              : c
          );
        } else {
          next = [
            ...current,
            {
              id: productId,
              product_id: productId,
              name: product.name,
              price: unitPrice,
              discount_enable: false,
              discount_value: 0,
              unit_price: unitPrice,
              image: product.image || "",
              stock: product.stock ?? 0,
              quantity,
              line_total: unitPrice * quantity,
            },
          ];
        }
        applyLocal(next);
        return;
      }

      setLoading(true);
      try {
        await cartApi.addCartItem(productId, quantity);
        const updated = await cartApi.getCart();
        setItems(updated.items);
      } catch (e: unknown) {
        setError(apiErrorMessage(e) || "No se pudo agregar al carrito");
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, applyLocal]
  );

  const changeQuantity = useCallback(
    async (productId: string, fn: (q: number) => number) => {
      setError("");
      if (!isAuthenticated) {
        const current = readLocal();
        const item = current.find((c) => c.product_id === productId);
        if (!item) return;
        const quantity = fn(item.quantity);
        if (quantity <= 0) {
          applyLocal(current.filter((c) => c.product_id !== productId));
        } else {
          const maxQty = Math.max(1, item.stock || 999);
          const nextQty = Math.min(quantity, maxQty);
          applyLocal(
            current.map((c) =>
              c.product_id === productId
                ? { ...c, quantity: nextQty, line_total: c.unit_price * nextQty }
                : c
            )
          );
        }
        return;
      }

      setLoading(true);
      try {
        const currentQty =
          itemsRef.current.find((c) => c.product_id === productId)?.quantity || 1;
        await cartApi.setCartItemQuantity(productId, fn(currentQty));
        const updated = await cartApi.getCart();
        setItems(updated.items);
      } catch (e: unknown) {
        setError(apiErrorMessage(e) || "No se pudo actualizar el carrito");
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, applyLocal]
  );

  const increment = useCallback(
    (productId: string) => changeQuantity(productId, (q) => q + 1),
    [changeQuantity]
  );

  const decrement = useCallback(
    (productId: string) => changeQuantity(productId, (q) => q - 1),
    [changeQuantity]
  );

  const removeItem = useCallback(
    async (productId: string) => {
      if (!isAuthenticated) {
        applyLocal(itemsRef.current.filter((c) => c.product_id !== productId));
        return;
      }
      setLoading(true);
      try {
        await cartApi.removeCartItem(productId);
        const updated = await cartApi.getCart();
        setItems(updated.items);
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, applyLocal]
  );

  const emptyCart = useCallback(async () => {
    if (!isAuthenticated) {
      applyLocal([]);
      return;
    }
    try {
      await cartApi.clearCart();
      setItems([]);
    } catch {
      // ignore
    }
  }, [isAuthenticated, applyLocal]);

  const subtotal = items.reduce((acc, item) => acc + item.line_total, 0);
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        subtotal,
        totalItems,
        loading,
        error,
        refresh,
        addToCart,
        increment,
        decrement,
        removeItem,
        emptyCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}