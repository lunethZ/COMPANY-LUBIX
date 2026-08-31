import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useRef,
} from "react";
import { useAuth } from "./AuthContext";
import { cartStore } from "../store/cartStore";
import * as cartApi from "../api/cart";
import type { CartItem } from "../types/cart";
import type { Product } from "../types/product";
import { effectivePrice } from "../types/product";
import { errorDetailMessage } from "../utils/errors";

export function productToCartItem(product: Product, quantity = 1): CartItem {
  const unit_price = effectivePrice(product);
  return {
    id: product.id,
    product_id: product.id,
    name: product.name,
    price: product.price,
    discount_enable: product.discount_enable,
    discount_value: product.discount_value,
    unit_price,
    image: product.images?.[0] ?? "",
    stock: product.stock,
    quantity,
    line_total: unit_price * quantity,
  };
}

interface CartContextType {
  items: CartItem[];
  subtotal: number;
  totalItems: number;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  addToCart: (product: Product, quantity?: number) => Promise<void>;
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

function totals(items: CartItem[]) {
  return {
    subtotal: items.reduce((acc, item) => acc + item.line_total, 0),
    totalItems: items.reduce((acc, item) => acc + item.quantity, 0),
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const wasAuthed = useRef(isAuthenticated);

  const applyLocal = useCallback(async (next: CartItem[]) => {
    await cartStore.set(next);
    setItems(next);
  }, []);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setItems(await cartStore.get());
      return;
    }
    setLoading(true);
    try {
      const cart = await cartApi.getCart();
      setItems(cart.items);
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
        const local = await cartStore.get();
        if (local.length) {
          try {
            await cartApi.mergeCart(
              local.map((i) => ({ product_id: i.product_id, quantity: i.quantity }))
            );
            await cartStore.clear();
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
          if (!cancelled) setItems(await cartStore.get());
        } finally {
          if (!cancelled) setLoading(false);
        }
      } else {
        if (wasAuthed.current) {
          await cartStore.set(itemsRef.current.length ? itemsRef.current : await cartStore.get());
        }
        if (cancelled) return;
        setItems(await cartStore.get());
        setLoading(false);
      }
      wasAuthed.current = isAuthenticated;
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const itemsRef = useRef(items);
  itemsRef.current = items;

  const addToCart = useCallback(
    async (product: Product, quantity = 1) => {
      setError("");
      if (!isAuthenticated) {
        const item = productToCartItem(product, quantity);
        const current = await cartStore.get();
        const existing = current.find((c) => c.product_id === item.product_id);
        const next = existing
          ? current.map((c) =>
              c.product_id === item.product_id
                ? {
                    ...c,
                    quantity: Math.min(
                      c.quantity + quantity,
                      Math.max(1, product.stock)
                    ),
                    line_total: c.unit_price * Math.min(
                      c.quantity + quantity,
                      Math.max(1, product.stock)
                    ),
                  }
                : c
            )
          : [...current, item];
        await applyLocal(next);
        return;
      }

      setLoading(true);
      try {
        await cartApi.addCartItem(product.id, quantity);
        const updated = await cartApi.getCart();
        setItems(updated.items);
      } catch (e: unknown) {
        setError(errorDetailMessage(e, "No se pudo agregar al carrito"));
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
        const current = await cartStore.get();
        const item = current.find((c) => c.product_id === productId);
        if (!item) return;
        const quantity = fn(item.quantity);
        if (quantity <= 0) {
          await applyLocal(current.filter((c) => c.product_id !== productId));
        } else {
          await applyLocal(
            current.map((c) =>
              c.product_id === productId
                ? { ...c, quantity: Math.min(quantity, c.stock), line_total: c.unit_price * Math.min(quantity, c.stock) }
                : c
            )
          );
        }
        return;
      }

      setLoading(true);
      try {
        await cartApi.setCartItemQuantity(productId, fn(itemsRef.current.find((c) => c.product_id === productId)?.quantity || 1));
        const updated = await cartApi.getCart();
        setItems(updated.items);
      } catch (e: unknown) {
        setError(errorDetailMessage(e, "No se pudo actualizar el carrito"));
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
        await applyLocal(itemsRef.current.filter((c) => c.product_id !== productId));
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
      await applyLocal([]);
      return;
    }
    try {
      await cartApi.clearCart();
      setItems([]);
    } catch {
      // ignore
    }
  }, [isAuthenticated, applyLocal]);

  const { subtotal, totalItems } = totals(items);

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