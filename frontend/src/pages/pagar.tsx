import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavbarAuto from "../components/navbar-auto";
import Footer from "../components/footer";
import api from "../api/axios";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import {
  CheckCircleIcon,
  CreditCardIcon,
  BuildingLibraryIcon,
  MapPinIcon,
  LockClosedIcon,
  ShoppingBagIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TicketIcon,
  ShieldCheckIcon,
  TruckIcon,
} from "@heroicons/react/24/outline";

type Step = "envio" | "pago" | "revision";
type MetodoPago = "tarjeta" | "pse";

const BANCOS = [
  "Bancolombia",
  "Banco de Bogotá",
  "BBVA Colombia",
  "Davivienda",
  "Banco Popular",
  "Scotiabank Colpatria",
  "Nequi",
  "Banco Agrario",
];

const COSTO_ENVIO = 15000;
const ENVIO_GRATIS_MIN = 100000;

function detectCardType(num: string): string {
  const n = num.replace(/\s/g, "");
  if (/^4/.test(n)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(n)) return "Mastercard";
  if (/^3[47]/.test(n)) return "Amex";
  if (/^(30[0-5]|36|38)/.test(n)) return "Diners";
  return "";
}

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  const type = detectCardType(digits);
  if (type === "Amex") {
    return digits
      .replace(/^(\d{4})(\d{0,6})(\d{0,5})$/, (_, a, b, c) => [a, b, c].filter(Boolean).join(" "));
  }
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return digits.slice(0, 2) + "/" + digits.slice(2);
}

function luhnCheck(num: string): boolean {
  const digits = num.replace(/\D/g, "");
  if (digits.length < 13) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = parseInt(digits[i], 10);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidExpiry(exp: string): boolean {
  const m = exp.match(/^(\d{2})\/(\d{2})$/);
  if (!m) return false;
  const month = parseInt(m[1], 10);
  if (month < 1 || month > 12) return false;
  const year = 2000 + parseInt(m[2], 10);
  const now = new Date();
  const expDate = new Date(year, month, 0);
  return expDate >= new Date(now.getFullYear(), now.getMonth(), 1);
}

function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `LUBX-${ts.slice(-6)}${rnd}`;
}

const resolveImage = (img?: string) => {
  if (!img) return "/placeholder.png";
  if (img.startsWith("http://") || img.startsWith("https://")) return img;
  const base = (import.meta.env.VITE_API_URL || "http://localhost:8002").replace(/\/$/, "");
  const path = img.startsWith("/files") ? img : img.startsWith("/") ? `/files${img}` : `/files/${img}`;
  return `${base}${path.replace("/files/files", "/files")}`;
};

const PagarPage = () => {
  const navigate = useNavigate();
  const { items, subtotal, emptyCart } = useCart();
  const { user } = useAuth();
  const cart = items;

  const [step, setStep] = useState<Step>("envio");
  const [processing, setProcessing] = useState(false);
  const [processMessage, setProcessMessage] = useState("");
  const [paid, setPaid] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [metodo, setMetodo] = useState<MetodoPago>("tarjeta");

  const [envio, setEnvio] = useState({
    nombre: "",
    email: "",
    telefono: "",
    documento: "",
    direccion: "",
    ciudad: "",
    departamento: "",
    codigoPostal: "",
    notas: "",
  });

  const [tarjeta, setTarjeta] = useState({
    numero: "",
    nombreTitular: "",
    expira: "",
    cvv: "",
  });

  const [banco, setBanco] = useState("");

  useEffect(() => {
    const prefill = async () => {
      try {
        const [meRes, addrRes] = await Promise.all([
          api.get("/user/dashboard/me").catch(() => ({ data: {} })),
          api.get("/user/addresses").catch(() => ({ data: [] })),
        ]);
        const me: any = meRes.data || {};
        const addrs: any[] = addrRes.data || [];
        const defAddr = addrs.find((a: any) => a.is_default) || addrs[0];
        setEnvio(prev => ({
          ...prev,
          nombre: me.fullName || (user as any)?.name || prev.nombre,
          email: me.email || (user as any)?.email || prev.email,
          telefono: me.tell || prev.telefono,
          direccion: defAddr?.address || prev.direccion,
          ciudad: defAddr?.city || prev.ciudad,
          departamento: defAddr?.department || prev.departamento,
          codigoPostal: defAddr?.postal_code || prev.codigoPostal,
        }));
      } catch {}
    };
    prefill();
  }, [user]);

  const descuentoPromo = 0;
  const baseEnvio = subtotal - descuentoPromo >= ENVIO_GRATIS_MIN ? 0 : COSTO_ENVIO;
  const total = subtotal - descuentoPromo + baseEnvio;

  const handleEnvioChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEnvio({ ...envio, [e.target.name]: e.target.value });
  };

  const handleTarjetaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "numero") {
      setTarjeta({ ...tarjeta, numero: formatCardNumber(value) });
    } else if (name === "expira") {
      setTarjeta({ ...tarjeta, expira: formatExpiry(value) });
    } else if (name === "cvv") {
      setTarjeta({ ...tarjeta, cvv: value.replace(/\D/g, "").slice(0, 4) });
    } else {
      setTarjeta({ ...tarjeta, [name]: value });
    }
  };

  const validateEnvio = (): boolean => {
    const e: Record<string, string> = {};
    if (!envio.nombre.trim()) e.nombre = "El nombre es obligatorio";
    if (!envio.email.trim()) e.email = "El correo es obligatorio";
    else if (!isValidEmail(envio.email)) e.email = "Correo no válido";
    if (!envio.telefono.trim()) e.telefono = "El teléfono es obligatorio";
    else if (envio.telefono.replace(/\D/g, "").length < 7) e.telefono = "Teléfono inválido";
    if (!envio.direccion.trim()) e.direccion = "La dirección es obligatoria";
    if (!envio.ciudad.trim()) e.ciudad = "La ciudad es obligatoria";
    if (!envio.departamento.trim()) e.departamento = "El departamento es obligatorio";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validatePago = (): boolean => {
    const e: Record<string, string> = {};
    if (metodo === "tarjeta") {
      const digits = tarjeta.numero.replace(/\D/g, "");
      if (!digits) e.numero = "Ingresa el número de la tarjeta";
      else if (digits.length < 15) e.numero = "Número incompleto";
      else if (!luhnCheck(digits)) e.numero = "Número de tarjeta inválido";
      if (!tarjeta.nombreTitular.trim()) e.nombreTitular = "Nombre del titular obligatorio";
      if (!tarjeta.expira.trim()) e.expira = "Fecha de expiración obligatoria";
      else if (!isValidExpiry(tarjeta.expira)) e.expira = "Fecha expirada o inválida";
      if (!tarjeta.cvv.trim()) e.cvv = "CVV obligatorio";
      else if (tarjeta.cvv.length < (detectCardType(tarjeta.numero) === "Amex" ? 4 : 3))
        e.cvv = "CVV incompleto";
    }
    if (metodo === "pse" && !banco) e.banco = "Selecciona tu banco";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goNext = () => {
    if (step === "envio") {
      if (validateEnvio()) setStep("pago");
      return;
    }
    if (step === "pago") {
      if (validatePago()) setStep("revision");
      return;
    }
  };

  const goBack = () => {
    setErrors({});
    if (step === "pago") setStep("envio");
    else if (step === "revision") setStep("pago");
  };

  const confirmPayment = async () => {
    setProcessing(true);
    const messages = [
      "Validando datos de la compra...",
      "Autorizando el método de pago...",
      "Confirmando con la pasarela de pagos...",
      "Generando tu pedido...",
    ];
    let i = 0;
    setProcessMessage(messages[0]);
    const interval = setInterval(() => {
      i++;
      if (i < messages.length) {
        setProcessMessage(messages[i]);
      }
    }, 700);

    try {
      const res = await api.post("/user/orders", {
        items: cart.map((item) => ({
          product_id: String(item.product_id),
          name: item.name,
          price: item.unit_price,
          quantity: item.quantity,
        })),
        subtotal,
        discount: descuentoPromo,
        shipping: baseEnvio,
        total,
        payment_method: metodo,
        recipient: envio.nombre,
        address: `${envio.direccion}`,
        city: envio.ciudad,
        department: envio.departamento,
        postal_code: envio.codigoPostal || undefined,
      });
      setOrderNumber(res.data.id);
      await emptyCart();
    } catch (err) {
      console.error("Error creating order:", err);
    }

    clearInterval(interval);
    localStorage.removeItem("cart");

    setProcessing(false);
    setPaid(true);
  };

  if (paid) {
    return (
      <div className="page-container min-h-screen">
        <NavbarAuto />
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
            <CheckCircleIcon className="w-12 h-12 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold mb-2">¡Pago exitoso!</h1>
          <p className="text-muted mb-6">
            Tu pedido ha sido registrado correctamente. Recibirás una confirmación por correo.
          </p>
          <div className="card mb-6 text-left">
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
              <span className="text-muted text-sm">Número de pedido</span>
              <span className="font-bold text-sm">{orderNumber}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
              <span className="text-muted text-sm">Productos</span>
              <span className="font-semibold text-sm">{cart.reduce((s, i) => s + i.quantity, 0)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
              <span className="text-muted text-sm">Método de pago</span>
              <span className="font-semibold text-sm">
                {metodo === "tarjeta" ? `Tarjeta ${detectCardType(tarjeta.numero)}` : `PSE · ${banco}`}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted text-sm">Total pagado</span>
              <span className="font-bold text-green-500 text-lg">${total.toLocaleString("es-CO")}</span>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate("/home-usuario")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-semibold transition"
            >
              Volver al inicio
            </button>
            <button
              onClick={() => navigate("/dashboard-usuario")}
              className="text-sm text-muted hover:text-accent transition"
            >
              Ver mis pedidos
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (processing) {
    return (
      <div className="page-container min-h-screen">
        <NavbarAuto />
        <div className="max-w-md mx-auto px-4 py-24 text-center">
          <div className="w-20 h-20 mx-auto mb-8 rounded-full border-4 border-emerald-500/30 border-t-emerald-500 animate-spin"></div>
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-6">
            <div className="h-full bg-emerald-500 rounded-full animate-pulse"></div>
          </div>
          <h2 className="text-xl font-bold mb-2">Procesando tu pago</h2>
          <p className="text-muted flex items-center justify-center gap-2">
            <LockClosedIcon className="w-4 h-4" />
            {processMessage}
          </p>
          <p className="text-xs text-muted mt-6">Transacción segura encriptada · No cierres esta ventana</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="page-container min-h-screen">
        <NavbarAuto />
        <div className="max-w-md mx-auto px-4 py-24 text-center">
          <ShoppingBagIcon className="w-20 h-20 mx-auto mb-5 opacity-30" />
          <h1 className="text-2xl font-bold mb-3">No hay productos para pagar</h1>
          <p className="text-muted mb-6">Tu carrito está vacío.</p>
          <button
            onClick={() => navigate("/home-usuario")}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-semibold transition"
          >
            Ver productos
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const steps: { id: Step; label: string }[] = [
    { id: "envio", label: "Envío" },
    { id: "pago", label: "Pago" },
    { id: "revision", label: "Revisar" },
  ];

  const stepIndex = steps.findIndex((s) => s.id === step);
  const cardType = detectCardType(tarjeta.numero);

  return (
    <div className="page-container min-h-screen">
      <NavbarAuto />
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Finalizar compra</h1>
          <button
            onClick={() => navigate("/carrito")}
            className="text-sm text-muted hover:text-accent transition flex items-center gap-1"
          >
            <ShoppingBagIcon className="w-4 h-4" />
            Volver al carrito
          </button>
        </div>

        <div className="flex items-center gap-2 mb-10">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition ${
                  i <= stepIndex
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-100 text-muted dark:bg-gray-800"
                }`}
              >
                {i < stepIndex ? <CheckCircleIcon className="w-4 h-4" /> : <span>{i + 1}</span>}
                {s.label}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-8 h-0.5 ${i < stepIndex ? "bg-emerald-600" : "bg-gray-200 dark:bg-gray-700"}`}></div>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-6">
            {step === "envio" && (
              <div className="card">
                <h2 className="font-bold text-lg mb-1 flex items-center gap-2">
                  <MapPinIcon className="w-5 h-5 text-emerald-600" />
                  Datos de envío
                </h2>
                <p className="text-sm text-muted mb-5">Ingresa la información del destinatario y la dirección de entrega.</p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-base">Nombre completo *</label>
                    <input name="nombre" value={envio.nombre} onChange={handleEnvioChange} className="input-base" placeholder="Juan Pérez" />
                    {errors.nombre && <p className="text-xs text-red-500 mt-1">{errors.nombre}</p>}
                  </div>
                  <div>
                    <label className="label-base">Documento de identidad</label>
                    <input name="documento" value={envio.documento} onChange={handleEnvioChange} className="input-base" placeholder="CC / NIT" />
                  </div>
                  <div>
                    <label className="label-base">Email *</label>
                    <input type="email" name="email" value={envio.email} onChange={handleEnvioChange} className="input-base" placeholder="tu@email.com" />
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="label-base">Teléfono *</label>
                    <input name="telefono" value={envio.telefono} onChange={handleEnvioChange} className="input-base" placeholder="300 123 4567" />
                    {errors.telefono && <p className="text-xs text-red-500 mt-1">{errors.telefono}</p>}
                  </div>
                  <div className="col-span-2">
                    <label className="label-base">Dirección de entrega *</label>
                    <input name="direccion" value={envio.direccion} onChange={handleEnvioChange} className="input-base" placeholder="Calle 123 #45-67" />
                    {errors.direccion && <p className="text-xs text-red-500 mt-1">{errors.direccion}</p>}
                  </div>
                  <div>
                    <label className="label-base">Ciudad *</label>
                    <input name="ciudad" value={envio.ciudad} onChange={handleEnvioChange} className="input-base" placeholder="Bogotá" />
                    {errors.ciudad && <p className="text-xs text-red-500 mt-1">{errors.ciudad}</p>}
                  </div>
                  <div>
                    <label className="label-base">Departamento *</label>
                    <input name="departamento" value={envio.departamento} onChange={handleEnvioChange} className="input-base" placeholder="Cundinamarca" />
                    {errors.departamento && <p className="text-xs text-red-500 mt-1">{errors.departamento}</p>}
                  </div>
                  <div>
                    <label className="label-base">Código postal</label>
                    <input name="codigoPostal" value={envio.codigoPostal} onChange={handleEnvioChange} className="input-base" placeholder="110111" />
                  </div>
                  <div>
                    <label className="label-base">Notas de entrega</label>
                    <input name="notas" value={envio.notas} onChange={handleEnvioChange} className="input-base" placeholder="Referencias, horarios..." />
                  </div>
                </div>

                <button onClick={goNext} className="btn-primary mt-6 flex items-center justify-center gap-2">
                  Continuar al pago <ChevronRightIcon className="w-5 h-5" />
                </button>
              </div>
            )}

            {step === "pago" && (
              <div className="card">
                <h2 className="font-bold text-lg mb-1 flex items-center gap-2">
                  <CreditCardIcon className="w-5 h-5 text-emerald-600" />
                  Método de pago
                </h2>
                <p className="text-sm text-muted mb-5">Selecciona cómo quieres pagar tu compra.</p>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  {([
                    { id: "tarjeta" as MetodoPago, label: "Tarjeta", icon: <CreditCardIcon className="w-6 h-6" /> },
                    { id: "pse" as MetodoPago, label: "PSE", icon: <BuildingLibraryIcon className="w-6 h-6" /> },
                  ]).map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMetodo(m.id)}
                      className={`p-4 rounded-xl border-2 transition flex flex-col items-center gap-2 text-sm font-semibold ${
                        metodo === m.id
                          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                          : "border-gray-200 dark:border-gray-700 text-muted hover:border-emerald-300"
                      }`}
                    >
                      {m.icon}
                      {m.label}
                    </button>
                  ))}
                </div>

                {metodo === "tarjeta" && (
                  <div className="space-y-4">
                    <div>
                      <label className="label-base">Número de tarjeta *</label>
                      <div className="relative">
                        <input
                          name="numero"
                          value={tarjeta.numero}
                          onChange={handleTarjetaChange}
                          className="input-base pr-20"
                          placeholder="4111 1111 1111 1111"
                          inputMode="numeric"
                        />
                        {cardType && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            {cardType}
                          </span>
                        )}
                      </div>
                      {errors.numero && <p className="text-xs text-red-500 mt-1">{errors.numero}</p>}
                    </div>
                    <div>
                      <label className="label-base">Nombre del titular *</label>
                      <input name="nombreTitular" value={tarjeta.nombreTitular} onChange={handleTarjetaChange} className="input-base" placeholder="Como aparece en la tarjeta" />
                      {errors.nombreTitular && <p className="text-xs text-red-500 mt-1">{errors.nombreTitular}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label-base">Expiración *</label>
                        <input name="expira" value={tarjeta.expira} onChange={handleTarjetaChange} className="input-base" placeholder="MM/AA" inputMode="numeric" />
                        {errors.expira && <p className="text-xs text-red-500 mt-1">{errors.expira}</p>}
                      </div>
                      <div>
                        <label className="label-base">CVV *</label>
                        <input name="cvv" value={tarjeta.cvv} onChange={handleTarjetaChange} className="input-base" placeholder="123" inputMode="numeric" type="password" />
                        {errors.cvv && <p className="text-xs text-red-500 mt-1">{errors.cvv}</p>}
                      </div>
                    </div>
                    <p className="text-xs text-muted flex items-center gap-1.5">
                      <LockClosedIcon className="w-3.5 h-3.5" />
                      Tus datos de pago están protegidos y cifrados. No se almacenan en nuestro servidor.
                    </p>
                  </div>
                )}

                {metodo === "pse" && (
                  <div className="space-y-4">
                    <div>
                      <label className="label-base">Selecciona tu banco *</label>
                      <select value={banco} onChange={(e) => setBanco(e.target.value)} className="input-base">
                        <option value="">-- Elige un banco --</option>
                        {BANCOS.map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                      {errors.banco && <p className="text-xs text-red-500 mt-1">{errors.banco}</p>}
                    </div>
                    <p className="text-xs text-muted flex items-center gap-1.5">
                      <BuildingLibraryIcon className="w-3.5 h-3.5" />
                      Serás redirigido a la pasarela de tu banco para autorizar el pago de forma segura.
                    </p>
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  <button onClick={goBack} className="btn-secondary flex items-center gap-2">
                    <ChevronLeftIcon className="w-4 h-4" /> Atrás
                  </button>
                  <button onClick={goNext} className="btn-primary flex items-center justify-center gap-2 flex-1">
                    Revisar compra <ChevronRightIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {step === "revision" && (
              <div className="card">
                <h2 className="font-bold text-lg mb-5 flex items-center gap-2">
                  <ShieldCheckIcon className="w-5 h-5 text-emerald-600" />
                  Revisa y confirma tu compra
                </h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted">Destinatario</h3>
                    <p className="text-sm">
                      {envio.nombre} · {envio.email} · {envio.telefono}
                    </p>
                    <p className="text-sm text-muted mt-1 flex items-center gap-1">
                      <MapPinIcon className="w-4 h-4" /> {envio.direccion}, {envio.ciudad}, {envio.departamento}
                      {envio.codigoPostal ? ` · ${envio.codigoPostal}` : ""}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted">Método de pago</h3>
                    <p className="text-sm flex items-center gap-2">
                      {metodo === "tarjeta" && (
                        <>
                          <CreditCardIcon className="w-4 h-4" />
                          Tarjeta {cardType} terminada en {tarjeta.numero.replace(/\s/g, "").slice(-4)} · Titular: {tarjeta.nombreTitular}
                        </>
                      )}
                      {metodo === "pse" && (
                        <>
                          <BuildingLibraryIcon className="w-4 h-4" />
                          PSE · {banco}
                        </>
                      )}

                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted">Productos</h3>
                    <div className="space-y-2">
                      {cart.map((item) => (
                        <div key={item.id} className="flex items-center gap-3">
                          <img src={resolveImage(item.image)} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.name}</p>
                            <p className="text-xs text-muted">Cantidad: {item.quantity}</p>
                          </div>
                          <p className="text-sm font-semibold">${(item.price * item.quantity).toLocaleString("es-CO")}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-8">
                  <button onClick={goBack} className="btn-secondary flex items-center gap-2">
                    <ChevronLeftIcon className="w-4 h-4" /> Atrás
                  </button>
                  <button onClick={confirmPayment} className="btn-primary flex items-center justify-center gap-2 flex-1">
                    <LockClosedIcon className="w-4 h-4" />
                    Confirmar y pagar ${total.toLocaleString("es-CO")}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="card lg:sticky lg:top-6">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <ShoppingBagIcon className="w-5 h-5 text-emerald-600" />
                Resumen del pedido
              </h2>

              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <img src={resolveImage(item.image)} alt={item.name} className="w-14 h-14 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted">Cantidad: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold">${(item.price * item.quantity).toLocaleString("es-CO")}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <div className="flex justify-between items-center py-1 text-sm">
                  <span className="text-muted">Subtotal</span>
                  <span className="font-semibold">${subtotal.toLocaleString("es-CO")}</span>
                </div>
                <div className="flex justify-between items-center py-1 text-sm">
                  <span className="text-muted">Envío</span>
                  <span className="font-semibold">
                    {baseEnvio === 0 ? (
                      <span className="text-emerald-600">GRATIS</span>
                    ) : (
                      `$${baseEnvio.toLocaleString("es-CO")}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-3 mt-2 border-t border-gray-100 dark:border-gray-800">
                  <span className="font-bold">Total</span>
                  <span className="text-xl font-extrabold text-emerald-600">${total.toLocaleString("es-CO")}</span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-2 text-xs text-muted">
                <p className="flex items-center gap-2">
                  <TruckIcon className="w-4 h-4 text-emerald-600" />
                  Envío gratis en compras superiores a ${ENVIO_GRATIS_MIN.toLocaleString("es-CO")}.
                </p>
                <p className="flex items-center gap-2">
                  <LockClosedIcon className="w-4 h-4 text-emerald-600" />
                  Pagos procesados de forma segura.
                </p>
                <p className="flex items-center gap-2">
                  <ShieldCheckIcon className="w-4 h-4 text-emerald-600" />
                  Compra protegida por Lubix.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PagarPage;