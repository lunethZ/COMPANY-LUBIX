import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/navbaruser';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import api from '../api/axios';
import { errorDetailMessage } from '../utils/errors';
const formatCOP = (value: number) => {
  return "$" + value.toLocaleString("es-CO", { maximumFractionDigits: 0 });
};

interface Producto {
  id: string;
  nombre: string;
  desc: string;
  precio: number;
  imagen: string;
}
import {
  UserIcon,
  CubeIcon,            
  HeartIcon,
  MapPinIcon,
  ChevronRightIcon,
  ShoppingBagIcon,
  CalendarIcon,
  ShieldCheckIcon,
  PencilSquareIcon,
  TruckIcon,
  CreditCardIcon,
  XMarkIcon,
  CheckCircleIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';

type Tab = 'overview' | 'orders' | 'saved' | 'integrated' | 'delete-product';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
}

interface Order {
  id: string;
  fecha: string;
  estado: string;
  items: OrderItem[];
  subtotal: number;
  descuento: number;
  envio: number;
  total: number;
  metodo: string;
  banco: string;
  direccionEnvio: string;
  destinatario: string;
  estimated_delivery: string;
  delivery_progress: number;
}

export default function BuyerDashboard() {
  const { user, logout, updateUser } = useAuth();
  const { addToCart: addCartItem } = useCart();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const themeClasses = {
    page: isDark ? 'bg-slate-950' : 'bg-gray-100',
    card: isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200 shadow-sm',
    cardInner: isDark ? 'bg-slate-800' : 'bg-gray-50',
    input: isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400',
    text: isDark ? 'text-white' : 'text-gray-900',
    textMuted: isDark ? 'text-gray-400' : 'text-gray-600',
    border: isDark ? 'border-slate-800' : 'border-gray-200',
    drawer: isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200',
  };
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
    memberSince: '',
    avatar: '',
    totalOrders: 0,
    totalSpent: 0,
    savedProducts: 0,
    addresses: 0,
  });
  const [loading, setLoading] = useState(true);
  const [favoriteProducts, setFavoriteProducts] = useState<Producto[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({ name: "", phone: "" });
  const [passForm, setPassForm] = useState({ current: "", newPass: "" });
  const [addresses, setAddresses] = useState<any[]>([]);
  const [addressForm, setAddressForm] = useState({ label: "", address: "", city: "", department: "", postal_code: "", is_default: false });
  const [profileMsg, setProfileMsg] = useState("");
  const [passMsg, setPassMsg] = useState("");
  const [addressMsg, setAddressMsg] = useState("");

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [activeTab]);

  const loadFavorites = async () => {
    try {
      const res = await api.get("/user/favorites");
      const items = (res.data || []).map((f: any) => ({
        id: f.product.id,
        nombre: f.product.name,
        desc: f.product.descripcion,
        precio: f.product.price,
        antes: null,
        descuento: f.product.discount_enable && f.product.discount_value > 0 ? `-${f.product.discount_value}%` : null,
        imagen: f.product.images?.[0] || "/placeholder.png",
        imagenes: f.product.images?.length ? f.product.images : ["/placeholder.png"],
        categoria: "General",
        stock: f.product.stock,
        tienda: { nombre: f.product.company_name || "Tienda", logo: (f.product.company_name || "T").charAt(0), direccion: "", ciudad: "", calificacion: 0, numResenas: 0, ventas: 0, miembrosDesde: "" },
        calificacion: 0,
        numResenas: 0,
        caracteristicas: [],
        reseñas: [],
      }));
      setFavoriteProducts(items);
    } catch (err) {
      console.error("Error fetching favorites:", err);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [activeTab]);

  useEffect(() => {
    if (showProfileDrawer) {
      loadAddresses();
      setProfileForm({ name: userData.name, phone: userData.phone });
    }
  }, [showProfileDrawer]);

  const loadOrders = async () => {
    try {
      const res = await api.get("/user/orders");
      const data = res.data || [];
      const list: Order[] = data.map((o: any) => ({
        id: o.id,
        fecha: o.created_at,
        estado: o.status,
        items: (o.items || []).map((i: any) => ({
          id: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          image: undefined,
        })),
        subtotal: o.subtotal,
        descuento: o.discount,
        envio: o.shipping,
        total: o.total,
        metodo: o.payment_method,
        banco: "",
        direccionEnvio: `${o.address}, ${o.city}`,
        destinatario: o.recipient,
        estimated_delivery: o.estimated_delivery || "",
        delivery_progress: o.delivery_progress || 0,
      }));
      setOrders(list);
      setUserData((prev) => ({
        ...prev,
        totalOrders: list.length,
        totalSpent: list.reduce((sum, o) => sum + (o.total || 0), 0),
      }));
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  const estadoLabel = (estado: string) => {
    const map: Record<string, string> = {
      pending: "Pendiente",
      paid: "Pagado",
      shipped: "Enviado",
      delivered: "Entregado",
      cancelled: "Cancelado",
    };
    return map[estado] || estado;
  };

  const loadAddresses = async () => {
    try {
      const res = await api.get("/user/addresses");
      setAddresses(res.data || []);
      setUserData((prev) => ({ ...prev, addresses: (res.data || []).length }));
    } catch (err) {
      console.error("Error fetching addresses:", err);
    }
  };

  const saveProfile = async () => {
    setProfileMsg("");
    try {
      await api.patch("/user/profile", { fullName: profileForm.name, tell: profileForm.phone });
      setProfileMsg("Perfil actualizado correctamente");
      setUserData((prev) => ({
        ...prev,
        name: profileForm.name || prev.name,
        phone: profileForm.phone || prev.phone,
        avatar: (profileForm.name || prev.name).charAt(0).toUpperCase(),
      }));
      if (profileForm.name) {
        updateUser({ name: profileForm.name });
      }
    } catch (err: any) {
      setProfileMsg(errorDetailMessage(err, "Error al actualizar el perfil"));
    }
  };

  const savePassword = async () => {
    setPassMsg("");
    try {
      await api.patch("/user/change-password", {
        current_password: passForm.current,
        new_password: passForm.newPass,
      });
      setPassMsg("Contraseña actualizada correctamente");
      setPassForm({ current: "", newPass: "" });
    } catch (err: any) {
      setPassMsg(errorDetailMessage(err, "Error al cambiar la contraseña"));
    }
  };

  const addAddress = async () => {
    setAddressMsg("");
    if (!addressForm.address.trim() || !addressForm.city.trim() || !addressForm.department.trim()) {
      setAddressMsg("Dirección, ciudad y departamento son obligatorios");
      return;
    }
    try {
      await api.post("/user/addresses", {
        label: addressForm.label?.trim() || null,
        address: addressForm.address.trim(),
        city: addressForm.city.trim(),
        department: addressForm.department.trim(),
        postal_code: addressForm.postal_code?.trim() || null,
        is_default: !!addressForm.is_default,
      });
      setAddressMsg("Dirección agregada correctamente");
      setAddressForm({ label: "", address: "", city: "", department: "", postal_code: "", is_default: false });
      await loadAddresses();
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      if (Array.isArray(detail)) {
        setAddressMsg(detail.map((d:any)=> d.msg).join(", "));
      } else {
        setAddressMsg(errorDetailMessage(err, "Error al agregar la dirección"));
      }
    }
  };

  const removeAddress = async (id: string) => {
    try {
      await api.delete(`/user/addresses/${id}`);
      loadAddresses();
    } catch (err) {
      console.error("Error deleting address:", err);
    }
  };

  const downloadData = async () => {
    try {
      const [exportRes, ordersRes, favRes, addrRes] = await Promise.all([
        api.get("/user/export").catch(() => ({ data: {} })),
        api.get("/user/orders").catch(() => ({ data: [] })),
        api.get("/user/favorites").catch(() => ({ data: [] })),
        api.get("/user/addresses").catch(() => ({ data: [] })),
      ]);
      const exportData = exportRes.data || {};
      const orders = ordersRes.data || [];
      const favorites = favRes.data || [];
      const addresses = addrRes.data || [];
      // Generar HTML bonito
      const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Mis datos - Lubix</title>
<style>
  body{font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#f8fafc;color:#0f172a;margin:0;padding:32px}
  .header{background:linear-gradient(90deg,#16a34a,#2563eb);color:white;padding:24px;border-radius:16px;margin-bottom:24px}
  .card{background:white;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:16px;box-shadow:0 1px 3px rgba(0,0,0,0.1)}
  h2{margin:0 0 12px 0;font-size:18px;color:#0f172a;border-bottom:2px solid #16a34a;padding-bottom:8px}
  h3{margin:16px 0 8px 0;font-size:14px;color:#475569}
  table{width:100%;border-collapse:collapse;font-size:13px}
  th{background:#f1f5f9;text-align:left;padding:8px;border:1px solid #e2e8f0}
  td{padding:8px;border:1px solid #e2e8f0}
  .badge{background:#dcfce7;color:#166534;padding:2px 8px;border-radius:999px;font-size:11px}
  .muted{color:#64748b;font-size:12px}
</style></head>
<body>
  <div class="header">
    <h1 style="margin:0;font-size:28px">Lubix - Mis Datos Personales</h1>
    <p style="margin:8px 0 0 0;opacity:0.9">Exportado el ${new Date().toLocaleString('es-CO')} &bull; ${exportData.email || ''}</p>
  </div>
  <div class="card">
    <h2>👤 Información Personal</h2>
    <table>
      <tr><th>Nombre</th><td>${exportData.fullName || ''}</td></tr>
      <tr><th>Email</th><td>${exportData.email || ''}</td></tr>
      <tr><th>Teléfono</th><td>${exportData.tell || ''}</td></tr>
      <tr><th>Rol</th><td><span class="badge">${exportData.role || ''}</span></td></tr>
      <tr><th>Verificado</th><td>${exportData.verified ? 'Sí' : 'No'}</td></tr>
      <tr><th>Miembro desde</th><td>${exportData.memberSince ? new Date(exportData.memberSince).toLocaleDateString('es-CO') : ''}</td></tr>
    </table>
  </div>
  <div class="card">
    <h2>📍 Direcciones (${addresses.length})</h2>
    ${addresses.length ? `<table><tr><th>Etiqueta</th><th>Dirección</th><th>Ciudad</th><th>Principal</th></tr>` + addresses.map(a=>`<tr><td>${a.label||''}</td><td>${a.address||''}</td><td>${a.city||''}</td><td>${a.is_default?'Sí':'No'}</td></tr>`).join('') + `</table>` : `<p class="muted">No hay direcciones guardadas</p>`}
  </div>
  <div class="card">
    <h2>🛒 Pedidos (${orders.length})</h2>
    ${orders.length ? orders.map(o=>`<div style="border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin-bottom:8px"><strong>#${String(o.id).slice(0,8)}</strong> - ${o.status} - $${(o.total||0).toLocaleString('es-CO')} <span class="muted">(${new Date(o.created_at).toLocaleDateString('es-CO')})</span><br><span class="muted">${(o.items||[]).map(i=> i.name + ' x' + i.quantity).join(', ')}</span></div>`).join('') : `<p class="muted">No hay pedidos</p>`}
  </div>
  <div class="card">
    <h2>❤️ Favoritos (${favorites.length})</h2>
    ${favorites.length ? `<table><tr><th>Producto</th><th>Precio</th></tr>` + favorites.map(f=>`<tr><td>${f.product?.name||f.product?.nombre||''}</td><td>$${(f.product?.price||0).toLocaleString('es-CO')}</td></tr>`).join('') + `</table>` : `<p class="muted">No hay favoritos</p>`}
  </div>
  <p class="muted" style="text-align:center;margin-top:24px">Documento generado por Lubix - Tus datos están protegidos</p>
</body></html>`;
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mis-datos-lubix-${new Date().toISOString().slice(0,10)}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exporting data:", err);
    }
  };

  const deleteAccount = async () => {
    const confirmed = window.confirm("¿Estás seguro de que quieres eliminar tu cuenta? Esta acción es irreversible y borrará todos tus datos, pedidos y direcciones.\n\nSi prefieres, puedes solicitar la eliminación vía PQRS.");
    if (!confirmed) return;
    const doubleConfirm = window.prompt("Escribe ELIMINAR para confirmar:");
    if (doubleConfirm !== "ELIMINAR") return;
    try {
      await api.delete("/user/account");
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      logout();
      navigate("/login", { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "Error al eliminar la cuenta";
      // Fallback a PQRS si el backend no permite borrado directo
      if (msg.includes("permiso") || err?.response?.status === 401) {
        navigate('/pqrs?type=eliminacion&subject=Solicitud de eliminación de cuenta');
      } else {
        alert(msg);
      }
    }
  };

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/user/dashboard/me");
      const data = res.data;

      setUserData({
        name: data.fullName || user?.name || "",
        email: data.email || user?.email || "",
        phone: data.tell || "",
        memberSince: data.memberSince ? new Date(data.memberSince).toLocaleDateString() : "",
        avatar: (data.fullName || "U").charAt(0).toUpperCase(),
        totalOrders: data.totalOrders || 0,
        totalSpent: data.totalSpent || 0,
        savedProducts: data.savedProducts || 0,
        addresses: data.addresses || 0,
      });
    } catch (err) {
      console.error("Error fetching user data:", err);
      if (user) {
        setUserData(prev => ({
          ...prev,
          name: user.name || "",
          email: user.email || "",
          avatar: user.name?.charAt(0)?.toUpperCase() || "U",
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (productId: string) => {
    try {
      await api.post(`/user/favorites/${productId}`);
      loadFavorites();
    } catch (err) {
      console.error("Error removing favorite:", err);
    }
  };

  const addToCart = (p: Producto) => {
    void addCartItem({
      id: p.id,
      name: p.nombre,
      price: p.precio,
      image: p.imagen,
    });
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Resumen', icon: <UserIcon className="w-4 h-4" /> },
    { id: 'orders', label: 'Mis Pedidos', icon: <CubeIcon className="w-4 h-4" /> },
    { id: 'integrated', label: 'Producto Integrado', icon: <CheckCircleIcon className="w-4 h-4" /> },
    { id: 'delete-product', label: 'Eliminar Producto', icon: <TrashIcon className="w-4 h-4" /> },
    { id: 'saved', label: 'Guardados', icon: <HeartIcon className="w-4 h-4" /> },
  ];

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-slate-950' : 'bg-gray-50'}`}>
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-950' : 'bg-gray-50'}`}>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl p-8 mb-8 shadow-xl shadow-blue-500/20">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="relative">
              <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center text-4xl font-bold text-blue-400 shadow-lg border-4 border-white/20">
                {userData.avatar}
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-white mb-1">{userData.name}</h1>
              <p className="text-blue-100 mb-3">{userData.email}</p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-white/80">
                <div className="flex items-center gap-1">
                  <CalendarIcon className="w-4 h-4" />
                  <span>Miembro desde {userData.memberSince}</span>
                </div>
                <div className="flex items-center gap-1">
                  <ShoppingBagIcon className="w-4 h-4" />
                  <span>{userData.totalOrders} compras realizadas</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setProfileForm({ name: userData.name, phone: userData.phone });
                setShowProfileDrawer(true);
              }}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2 rounded-lg transition-colors border border-white/20"
            >
              <PencilSquareIcon className="w-4 h-4" />
              Editar perfil
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                  : 'bg-slate-800 text-gray-400 hover:text-gray-200 hover:bg-slate-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Pedidos', value: userData.totalOrders, icon: <CubeIcon className="w-5 h-5 text-blue-400" /> },
                { label: 'Total gastado', value: `$${userData.totalSpent.toLocaleString()}`, icon: <ShoppingBagIcon className="w-5 h-5 text-green-400" /> },
                { label: 'Guardados', value: favoriteProducts.length, icon: <HeartIcon className="w-5 h-5 text-pink-400" /> },
                { label: 'Direcciones', value: userData.addresses, icon: <MapPinIcon className="w-5 h-5 text-yellow-400" /> },
              ].map((stat) => (
                <div key={stat.label} className={`${themeClasses.card} rounded-xl p-5 hover:border-slate-700 transition-all`>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-400 text-sm">{stat.label}</span>
                    {stat.icon}
                  </div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </div>
              ))}
            </div>

            {favoriteProducts.length > 0 && (
              <div className={`${themeClasses.card} rounded-xl p-6`>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-white">Productos guardados</h2>
                  <button onClick={() => setActiveTab('saved')} className="flex items-center gap-1 text-green-400 hover:text-green-300 text-sm">
                    Ver todos <ChevronRightIcon className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {favoriteProducts.slice(0, 3).map((p) => (
                    <div key={p.id} className="rounded-xl overflow-hidden bg-slate-800 hover:bg-slate-700 transition-all group cursor-pointer">
                      <div className="relative">
                        <img src={p.imagen} alt={p.nombre} className="w-full h-28 object-cover group-hover:scale-105 transition-transform duration-300" />
                        <button
                          onClick={() => removeFavorite(String(p.id))}
                          className="absolute top-2 right-2 w-7 h-7 bg-slate-900/80 rounded-full flex items-center justify-center"
                        >
                          <HeartSolid className="w-3.5 h-3.5 text-pink-400" />
                        </button>
                      </div>
                      <div className="p-3">
                        <p className="text-white text-sm font-medium line-clamp-1">{p.nombre}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-green-400 font-bold text-sm">${(p.precio / 1000000).toFixed(1)}M</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {favoriteProducts.length === 0 && (
              <div className="text-center py-20 text-gray-400 bg-slate-900 rounded-xl border border-slate-800">
                <ShoppingBagIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">Bienvenido a Lubix</p>
                <p className="text-sm mt-1">Explora productos y empieza a comprar</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className={`${themeClasses.card} rounded-xl p-6`>
            <h2 className="text-xl font-bold text-white mb-6">Todos mis pedidos ({orders.length})</h2>
            {orders.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <CubeIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">No tienes pedidos aún</p>
                <p className="text-sm mt-1">Tus compras aparecerán aquí</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="border border-slate-800 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setSelectedOrder(selectedOrder === order.id ? null : order.id)}
                      className="w-full flex items-center gap-4 p-4 hover:bg-slate-800/60 transition-colors"
                    >
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center gap-3">
                          <p className="text-white font-bold text-sm truncate">{order.id}</p>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 whitespace-nowrap">
                            {estadoLabel(order.estado)}
                          </span>
                        </div>
                        <p className="text-gray-500 text-xs mt-1">
                          {new Date(order.fecha).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 font-bold">${order.total.toLocaleString("es-CO")}</p>
                        <p className="text-gray-500 text-xs">{order.items.reduce((s, i) => s + i.quantity, 0)} producto(s)</p>
                      </div>
                      <ChevronRightIcon className={`w-5 h-5 text-gray-400 transition-transform ${selectedOrder === order.id ? "rotate-90" : ""}`} />
                    </button>

                    {selectedOrder === order.id && (
                      <div className="border-t border-slate-800 p-5 bg-slate-950/50 space-y-6">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Estado del envío</h3>
                          <div className="bg-slate-800 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <span className="text-white text-sm font-semibold">{estadoLabel(order.estado)}</span>
                              </div>
                              {order.estimated_delivery && order.estado !== 'delivered' && order.estado !== 'cancelled' && (
                                <span className="text-gray-400 text-xs">
                                  Llega estimado: {new Date(order.estimated_delivery).toLocaleDateString("es-CO", { day: "numeric", month: "long" })}
                                </span>
                              )}
                            </div>
                            <div className="relative mb-3">
                              <div className="w-full bg-slate-700 rounded-full h-3">
                                <div
                                  className={`h-3 rounded-full transition-all duration-1000 ease-out ${
                                    order.estado === 'cancelled' ? 'bg-red-500' : 'bg-gradient-to-r from-green-600 to-emerald-400'
                                  }`}
                                  style={{ width: `${order.delivery_progress}%` }}
                                />
                              </div>
                              {order.estado !== 'cancelled' && (
                                <div
                                  className="absolute top-1/2 -translate-y-1/2 transition-all duration-1000 ease-out"
                                  style={{ left: `calc(${Math.min(order.delivery_progress, 95)}% - 12px)` }}
                                >
                                  <div className="relative">
                                    <svg width="28" height="20" viewBox="0 0 28 20" fill="none" className="drop-shadow-lg">
                                      <rect x="0" y="4" width="18" height="12" rx="2" fill="#22c55e"/>
                                      <rect x="18" y="7" width="8" height="9" rx="1" fill="#16a34a"/>
                                      <rect x="2" y="6" width="5" height="4" rx="1" fill="#86efac" opacity="0.7"/>
                                      <rect x="8" y="6" width="5" height="4" rx="1" fill="#86efac" opacity="0.7"/>
                                      <circle cx="6" cy="17" r="2.5" fill="#333" stroke="#555" strokeWidth="0.5"/>
                                      <circle cx="6" cy="17" r="1" fill="#888"/>
                                      <circle cx="22" cy="17" r="2.5" fill="#333" stroke="#555" strokeWidth="0.5"/>
                                      <circle cx="22" cy="17" r="1" fill="#888"/>
                                    </svg>
                                    {order.delivery_progress > 0 && order.delivery_progress < 100 && (
                                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span className={order.delivery_progress >= 15 ? 'text-green-400' : ''}>Confirmado</span>
                              <span className={order.delivery_progress >= 35 ? 'text-green-400' : ''}>Confirmado</span>
                              <span className={order.delivery_progress >= 65 ? 'text-green-400' : ''}>Enviado</span>
                              <span className={order.delivery_progress >= 100 ? 'text-green-400' : ''}>Entregado</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Productos</h3>
                          <div className="space-y-3">
                            {order.items.map((item) => (
                              <div key={item.id} className="flex items-center gap-3">
                                {item.image ? (
                                  <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover bg-slate-800" />
                                ) : (
                                  <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center text-gray-500">
                                    <CubeIcon className="w-5 h-5" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-white text-sm font-medium truncate">{item.name}</p>
                                  <p className="text-gray-500 text-xs">Cantidad: {item.quantity}</p>
                                </div>
                                <p className="text-white text-sm font-semibold">${(item.price * item.quantity).toLocaleString("es-CO")}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Resumen</h3>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-500">Subtotal</span>
                                <span className="text-white">${order.subtotal.toLocaleString("es-CO")}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Descuento</span>
                                <span className="text-green-400">-${order.descuento.toLocaleString("es-CO")}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Envío</span>
                                <span className="text-white">{order.envio === 0 ? 'GRATIS' : `$${order.envio.toLocaleString("es-CO")}`}</span>
                              </div>
                              <div className="flex justify-between pt-2 border-t border-slate-800">
                                <span className="text-gray-300 font-semibold">Total</span>
                                <span className="text-green-400 font-bold">${order.total.toLocaleString("es-CO")}</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Envío y pago</h3>
                            <div className="space-y-2 text-sm">
                              <p className="flex items-center gap-2 text-gray-400">
                                <TruckIcon className="w-4 h-4 text-green-500" />
                                {order.direccionEnvio}
                              </p>
                              <p className="flex items-center gap-2 text-gray-400">
                                <CreditCardIcon className="w-4 h-4 text-green-500" />
                                {order.metodo === "tarjeta" ? "Tarjeta de crédito/débito" : order.metodo === "pse" ? "PSE" : order.metodo === "efectivo" ? "Pago contra entrega (efectivo)" : order.metodo}
                              </p>
                              <p className="flex items-center gap-2 text-gray-400">
                                <UserIcon className="w-4 h-4 text-green-500" />
                                {order.destinatario}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'saved' && (
          <div className={`${themeClasses.card} rounded-xl p-6`>
            <h2 className="text-xl font-bold text-white mb-6">Productos guardados ({favoriteProducts.length})</h2>
            {favoriteProducts.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <HeartIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">No tienes productos guardados</p>
                <p className="text-sm mt-1">Ve al inicio y haz clic en el corazón para guardar productos</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {favoriteProducts.map((p) => (
                    <div key={p.id} className="rounded-xl overflow-hidden bg-slate-800 hover:shadow-lg hover:shadow-blue-500/10 transition-all group">
                    <div className="relative">
                      <img src={p.imagen} alt={p.nombre} className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300" />
                      <button
                        onClick={() => removeFavorite(String(p.id))}
                        className="absolute top-3 right-3 w-8 h-8 bg-slate-900/80 rounded-full flex items-center justify-center hover:bg-red-500/20 transition-colors"
                      >
                        <HeartSolid className="w-4 h-4 text-pink-400" />
                      </button>
                    </div>
                    <div className="p-4">
                      <p className="text-white font-semibold mb-2">{p.nombre}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-green-400 font-bold text-lg">${p.precio.toLocaleString('es-CO')}</span>
                      </div>
                      <button
                        onClick={() => addToCart(p)}
                        className="w-full mt-3 py-2 bg-green-500 hover:bg-green-400 text-white rounded-lg font-medium transition-colors"
                      >
                        Agregar al carrito
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'integrated' && (
          <div className={`${themeClasses.card} rounded-xl p-6`>
            <h2 className="text-xl font-bold text-white mb-6">Productos Integrados</h2>
            {orders.filter(o => o.estado === 'delivered').length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <CheckCircleIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">No tienes productos integrados aún</p>
                <p className="text-sm mt-1">Los productos de pedidos entregados aparecerán aquí</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.filter(o => o.estado === 'delivered').map((order) => (
                  <div key={order.id} className="border border-green-500/30 rounded-xl p-4 bg-green-500/5">
                    <div className="flex items-center gap-3 mb-3">
                      <CheckCircleIcon className="w-5 h-5 text-green-400" />
                      <span className="text-green-400 font-semibold text-sm">Producto entregado e integrado</span>
                      <span className="text-gray-500 text-xs ml-auto">
                        {new Date(order.fecha).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 bg-slate-800 rounded-lg p-3">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
                              <CubeIcon className="w-4 h-4 text-gray-500" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{item.name}</p>
                            <p className="text-gray-500 text-xs">Cantidad: {item.quantity}</p>
                          </div>
                          <p className="text-green-400 text-sm font-semibold">${(item.price * item.quantity).toLocaleString("es-CO")}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'delete-product' && (
          <div className={`${themeClasses.card} rounded-xl p-6`>
            <h2 className="text-xl font-bold text-white mb-6">Eliminar Producto</h2>
            <p className="text-gray-400 text-sm mb-6">Selecciona un producto de tus pedidos para solicitar su eliminación o reportar un problema.</p>
            {orders.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <TrashIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">No tienes productos en pedidos</p>
                <p className="text-sm mt-1">Realiza una compra para poder gestionar tus productos</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) =>
                  order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 bg-slate-800 rounded-xl border border-slate-700 hover:border-red-500/30 transition-colors">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center">
                          <CubeIcon className="w-5 h-5 text-gray-500" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{item.name}</p>
                        <p className="text-gray-500 text-xs">Pedido: {order.id.slice(0, 8)}... · {estadoLabel(order.estado)}</p>
                      </div>
                      <p className="text-white text-sm font-semibold mr-3">${item.price.toLocaleString("es-CO")}</p>
                      <button
                        onClick={() => navigate(`/pqrs?type=queja&subject=Problema con producto: ${item.name}`)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-lg text-xs font-semibold transition-all"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                        Reportar
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

      </div>

      {showProfileDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowProfileDrawer(false)} />
          <div className={`relative w-full max-w-md ${themeClasses.drawer} border-l shadow-2xl overflow-y-auto animate-slide-in-right`}>
            <div className={`sticky top-0 z-10 ${themeClasses.drawer} border-b p-6 flex items-center justify-between`}>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <PencilSquareIcon className="w-5 h-5 text-blue-400" />
                Mi perfil
              </h2>
              <button
                onClick={() => setShowProfileDrawer(false)}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <UserIcon className="w-4 h-4" /> Información personal
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Nombre completo</label>
                    <input
                      value={profileForm.name}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
                      className={`w-full px-3 py-2 ${themeClasses.input} rounded-lg text-sm focus:outline-none focus:border-green-500`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Teléfono</label>
                    <input
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))}
                      className={`w-full px-3 py-2 ${themeClasses.input} rounded-lg text-sm focus:outline-none focus:border-green-500`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Correo electrónico</label>
                    <input value={userData.email} disabled className={`w-full px-3 py-2 ${isDark ? "bg-slate-800/50 border-slate-800 text-gray-500" : "bg-gray-100 border-gray-200 text-gray-500"} rounded-lg text-sm cursor-not-allowed`} />
                  </div>
                  {profileMsg && <p className={`text-sm ${profileMsg.startsWith("Perfil") ? "text-green-400" : "text-red-400"}`}>{profileMsg}</p>}
                  <button onClick={saveProfile} className="w-full py-2.5 bg-green-500 hover:bg-green-400 text-white rounded-lg font-medium transition-colors">
                    Guardar cambios
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-6">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <ShieldCheckIcon className="w-4 h-4" /> Seguridad
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Contraseña actual</label>
                    <input
                      type="password"
                      value={passForm.current}
                      onChange={(e) => setPassForm((prev) => ({ ...prev, current: e.target.value }))}
                      className={`w-full px-3 py-2 ${themeClasses.input} rounded-lg text-sm focus:outline-none focus:border-green-500`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Nueva contraseña</label>
                    <input
                      type="password"
                      value={passForm.newPass}
                      onChange={(e) => setPassForm((prev) => ({ ...prev, newPass: e.target.value }))}
                      className={`w-full px-3 py-2 ${themeClasses.input} rounded-lg text-sm focus:outline-none focus:border-green-500`}
                    />
                  </div>
                  {passMsg && <p className={`text-sm ${passMsg.startsWith("Contraseña actualizada") ? "text-green-400" : "text-red-400"}`}>{passMsg}</p>}
                  <button onClick={savePassword} className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors">
                    Cambiar contraseña
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-6">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <MapPinIcon className="w-4 h-4" /> Direcciones
                </h3>
                <div className="space-y-3 mb-4">
                  <div className="grid grid-cols-2 gap-3">
                    <input value={addressForm.label} onChange={(e) => setAddressForm((prev) => ({ ...prev, label: e.target.value }))} placeholder="Etiqueta (Casa, Oficina)" className={`px-3 py-2 ${themeClasses.input} rounded-lg text-sm focus:outline-none focus:border-green-500`} />
                    <input value={addressForm.postal_code} onChange={(e) => setAddressForm((prev) => ({ ...prev, postal_code: e.target.value }))} placeholder="Código postal" className={`px-3 py-2 ${themeClasses.input} rounded-lg text-sm focus:outline-none focus:border-green-500`} />
                  </div>
                  <input value={addressForm.address} onChange={(e) => setAddressForm((prev) => ({ ...prev, address: e.target.value }))} placeholder="Dirección" className={`w-full px-3 py-2 ${themeClasses.input} rounded-lg text-sm focus:outline-none focus:border-green-500`} />
                  <div className="grid grid-cols-2 gap-3">
                    <input value={addressForm.city} onChange={(e) => setAddressForm((prev) => ({ ...prev, city: e.target.value }))} placeholder="Ciudad" className={`px-3 py-2 ${themeClasses.input} rounded-lg text-sm focus:outline-none focus:border-green-500`} />
                    <input value={addressForm.department} onChange={(e) => setAddressForm((prev) => ({ ...prev, department: e.target.value }))} placeholder="Departamento" className={`px-3 py-2 ${themeClasses.input} rounded-lg text-sm focus:outline-none focus:border-green-500`} />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                    <input type="checkbox" checked={addressForm.is_default} onChange={(e) => setAddressForm((prev) => ({ ...prev, is_default: e.target.checked }))} className="w-4 h-4 accent-green-500" />
                    Usar como dirección principal
                  </label>
                  {addressMsg && <p className={`text-sm ${addressMsg.startsWith("Dirección agregada") ? "text-green-400" : "text-red-400"}`}>{addressMsg}</p>}
                  <button onClick={addAddress} className="w-full py-2 bg-green-500 hover:bg-green-400 text-white rounded-lg font-medium transition-colors">
                    Agregar dirección
                  </button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {addresses.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-3">No tienes direcciones guardadas</p>
                  ) : (
                    addresses.map((addr) => (
                      <div key={addr.id} className={`flex items-center justify-between p-3 ${themeClasses.cardInner} rounded-lg`}>
                        <div className="min-w-0">
                          <p className="text-white text-sm font-medium">
                            {addr.label || "Dirección"} {addr.is_default && <span className="text-xs text-green-400 ml-1">(principal)</span>}
                          </p>
                          <p className="text-gray-500 text-xs truncate">{addr.address}, {addr.city}, {addr.department}</p>
                        </div>
                        <button onClick={() => removeAddress(addr.id)} className="ml-3 text-red-400 hover:text-red-300 text-sm whitespace-nowrap">
                          Eliminar
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="border-t border-slate-800 pt-6 pb-4">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" /> Mis datos
                </h3>
                <div className="space-y-2">
                  <button onClick={downloadData} className="w-full flex items-center justify-between p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
                    <span className="text-white text-sm">Descargar mis datos</span>
                    <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                  </button>
                  <button onClick={deleteAccount} className="w-full flex items-center justify-between p-3 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors">
                    <span className="text-red-400 text-sm">Eliminar mi cuenta</span>
                    <ChevronRightIcon className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
