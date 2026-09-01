import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import NavbarAuto from "../components/navbar-auto";
import Footer from "../components/footer";
import { TrashIcon, ShoppingBagIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { resolveImage } from "../pages/producto-detalle";

const CartPage = () => {
  const { items, subtotal, totalItems, increment, decrement, removeItem } = useCart();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  const homeRoute = user?.role_id === "user"
    ? "/home-usuario"
    : user?.role_id === "empresa"
      ? "/home-empresa"
      : user?.role_id === "admin"
        ? "/dashboard-admin"
        : "/";

  const handleCheckout = () => {
    if (!isAuthenticated) {
      setShowAuthPrompt(true);
      return;
    }
    navigate("/pago");
  };

  return (
    <div className="page-container min-h-screen">
      <NavbarAuto />
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-8" style={{ color: "var(--color-text)" }}>
          Carrito de Compras
        </h1>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBagIcon className="w-20 h-20 mx-auto mb-4 opacity-30" style={{ color: "var(--color-muted)" }} />
            <p className="text-lg font-medium mb-2" style={{ color: "var(--color-text)" }}>Tu carrito está vacío</p>
            <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>Explora productos y agrégalos a tu carrito</p>
            <Link
              to={homeRoute}
              className="inline-block bg-green-500 hover:bg-green-400 text-white px-6 py-2.5 rounded-xl font-semibold transition"
            >
              Ver productos
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.product_id}
                className="flex items-center gap-4 p-4 rounded-xl border"
                style={{ backgroundColor: "var(--color-bg-card)", borderColor: "var(--color-border)" }}
              >
                {item.image ? (
                  <img src={resolveImage(item.image)} alt={item.name} className="w-20 h-20 rounded-lg object-cover" />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <ShoppingBagIcon className="w-8 h-8 opacity-30" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold" style={{ color: "var(--color-text)" }}>{item.name}</h3>
                  <p className="text-lg font-bold text-green-500">${item.unit_price.toLocaleString("es-CO")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => decrement(item.product_id)}
                    className="w-8 h-8 rounded-lg font-bold"
                    style={{ backgroundColor: "var(--color-bg-secondary)", color: "var(--color-text)" }}
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-semibold" style={{ color: "var(--color-text)" }}>{item.quantity}</span>
                  <button
                    onClick={() => increment(item.product_id)}
                    className="w-8 h-8 rounded-lg font-bold"
                    style={{ backgroundColor: "var(--color-bg-secondary)", color: "var(--color-text)" }}
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => removeItem(item.product_id)}
                  className="p-2 text-red-400 hover:text-red-300 transition"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            ))}
            <div className="text-right pt-4">
              <p className="text-xl font-bold" style={{ color: "var(--color-text)" }}>
                Total ({totalItems} {totalItems === 1 ? "artículo" : "artículos"}): <span className="text-green-500">${subtotal.toLocaleString("es-CO")}</span>
              </p>
              <button
                onClick={handleCheckout}
                className="mt-3 bg-green-500 hover:bg-green-400 text-white px-8 py-3 rounded-xl font-semibold transition"
              >
                Proceder al pago
              </button>
            </div>
          </div>
        )}

        {showAuthPrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowAuthPrompt(false)}>
            <div
              className="w-full max-w-md rounded-2xl p-8 text-center shadow-2xl"
              style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center bg-green-500/10">
                <LockClosedIcon className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--color-text)" }}>Necesitas una cuenta</h2>
              <p className="mb-6" style={{ color: "var(--color-muted)" }}>
                Para continuar con la compra debes iniciar sesión o registrarte. Tu carrito se conservará.
              </p>
              <div className="space-y-3">
                <Link
                  to="/login"
                  className="block w-full bg-green-500 hover:bg-green-400 text-white py-3 rounded-xl font-semibold transition"
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/register"
                  className="block w-full border border-green-500 text-green-500 py-3 rounded-xl font-semibold transition"
                >
                  Registrarme
                </Link>
                <button
                  onClick={() => setShowAuthPrompt(false)}
                  className="w-full py-2 text-sm hover:underline"
                  style={{ color: "var(--color-muted)" }}
                >
                  Seguir comprando
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default CartPage;
