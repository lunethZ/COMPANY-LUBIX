import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useMemo,
} from "react";
import { useCart } from "./CartContext";
import { createOrder } from "../api/user";
import {
  COSTO_ENVIO,
  ENVIO_GRATIS_MIN,
  PROMO_CODE,
  PROMO_DISCOUNT,
} from "../constants/shop";
import type { Address } from "../types/user";
import type { PaymentMethod } from "../types/order";

export interface CheckoutAddress {
  label: string | null;
  address: string;
  city: string;
  department: string;
  postal_code: string | null;
  is_default: boolean;
}

interface CheckoutContextType {
  address: CheckoutAddress | null;
  setAddress: (address: CheckoutAddress | null) => void;
  recipient: string;
  setRecipient: (name: string) => void;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  promo: string;
  setPromo: (code: string) => void;
  promoApplied: boolean;
  discount: number;
  shipping: number;
  total: number;
  submitting: boolean;
  submit: () => Promise<string>;
}

export const CheckoutContext = createContext<CheckoutContextType | null>(null);

export const useCheckout = () => {
  const context = useContext(CheckoutContext);
  if (!context) {
    throw new Error("useCheckout must be used within CheckoutProvider");
  }
  return context;
};

export function CheckoutProvider({ children }: { children: ReactNode }) {
  const { items, subtotal, emptyCart } = useCart();
  const [address, setAddress] = useState<CheckoutAddress | null>(null);
  const [recipient, setRecipient] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("tarjeta");
  const [promo, setPromo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const promoApplied = useMemo(
    () => promo.trim().toUpperCase() === PROMO_CODE && subtotal > 0,
    [promo, subtotal]
  );

  const discount = promoApplied ? subtotal * PROMO_DISCOUNT : 0;
  const shipping = subtotal === 0 || subtotal >= ENVIO_GRATIS_MIN ? 0 : COSTO_ENVIO;
  const total = subtotal - discount + shipping;

  const submit = useCallback(async (): Promise<string> => {
    if (!address) {
      throw new Error("Falta la dirección de envío");
    }
    setSubmitting(true);
    try {
      const result = await createOrder({
        items: items.map((item) => ({
          product_id: item.product_id,
          name: item.name,
          price: item.unit_price,
          quantity: item.quantity,
        })),
        subtotal,
        discount,
        shipping,
        total,
        payment_method: paymentMethod,
        recipient: recipient.trim() || undefined || "",
        address: address.address,
        city: address.city,
        department: address.department,
        postal_code: address.postal_code || undefined,
      });
      await emptyCart();
      return result.id;
    } finally {
      setSubmitting(false);
    }
  }, [address, items, subtotal, discount, shipping, total, paymentMethod, recipient, emptyCart]);

  return (
    <CheckoutContext.Provider
      value={{
        address,
        setAddress,
        recipient,
        setRecipient,
        paymentMethod,
        setPaymentMethod,
        promo,
        setPromo,
        promoApplied,
        discount,
        shipping,
        total,
        submitting,
        submit,
      }}
    >
      {children}
    </CheckoutContext.Provider>
  );
}