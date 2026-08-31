import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import api from "../api/axios";
import { HeartIcon as HeartOutline } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import { ShoppingCartIcon, CheckCircleIcon } from "@heroicons/react/24/solid";

interface Producto {
  id: string;
  nombre: string;
  desc: string;
  precio: number;
  antes?: number | null;
  descuento?: string | null;
  imagen: string;
  tienda: { nombre: string };
  calificacion: number;
  numResenas: number;
}

interface Oferta {
  imagen: string;
  titulo: string;
  descripcion: string;
}

const OFERTAS: Oferta[] = [
  { imagen: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600", titulo: "Laptops", descripcion: "Las mejores marcas con descuentos exclusivos" },
  { imagen: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600", titulo: "Celulares", descripcion: "Smartphones de última generación" },
  { imagen: "https://images.unsplash.com/photo-1585298723682-7115561c51b7?w=600", titulo: "Accesorios", descripcion: "Todo para tu setup" },
];

const formatCOP = (valor: number) => {
  return valor.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
};

const Home: React.FC = () => {
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [cartMsg, setCartMsg] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastName, setToastName] = useState("");
  const [showAuthFav, setShowAuthFav] = useState(false);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => setIndex((prev) => (prev + 1) % OFERTAS.length), 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    api.get("/products/search")
      .then((res) => {
        const items = (res.data.products || []).map((p: any) => ({
          id: p.id,
          nombre: p.name,
          desc: p.descripcion,
          precio: p.price,
          imagen: p.images?.[0] || "/placeholder.png",
          tienda: { nombre: p.company_name || "Tienda" },
          calificacion: p.avg_rating || 0,
          numResenas: p.review_count || 0,
        }));
        setProductos(items);
      })
      .catch(() => setProductos([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    api.get("/user/favorites")
      .then((res) => {
        const ids = new Set<string>((res.data || []).map((f: any) => f.product?.id));
        setFavorites(ids);
      })
      .catch(() => {});
  }, [isAuthenticated]);

  const handleFavorite = async (id: string) => {
    if (!isAuthenticated) {
      setShowAuthFav(true);
      return;
    }
    try {
      const res = await api.post(`/user/favorites/${id}`);
      setFavorites((prev) => {
        const next = new Set(prev);
        if (res.data.is_favorite) {
          next.add(id);
        } else {
          next.delete(id);
        }
        return next;
      });
    } catch (err) {
      console.error("Error toggling favorite:", err);
    }
  };

  const handleAddToCart = (prod: Producto) => {
    void addToCart({
      id: prod.id,
      name: prod.nombre,
      price: prod.precio,
      image: prod.imagen,
    });
    setCartMsg(prod.id);
    setToastName(prod.nombre);
    setShowToast(true);
    setTimeout(() => setCartMsg(null), 1500);
    setTimeout(() => setShowToast(false), 2500);
  };


  const renderProducto = (prod: Producto) => {
    const isFav = favorites.has(prod.id);
    return (
      <div key={prod.id} className="bg-white dark:bg-slate-900 rounded-xl shadow-lg overflow-hidden hover:-translate-y-2 transition relative flex flex-col">
        <button
          onClick={() => handleFavorite(prod.id)}
          className="absolute top-3 right-3 z-10 w-9 h-9 bg-white/80 dark:bg-slate-800/80 rounded-full flex items-center justify-center shadow hover:scale-110 transition"
        >
          {isFav ? <HeartSolid className="w-5 h-5 text-pink-500" /> : <HeartOutline className="w-5 h-5 text-gray-500" />}
        </button>

        <div
          className="cursor-pointer"
          onClick={() => navigate(`/producto/${prod.id}`)}
        >
          <img src={prod.imagen} alt={prod.nombre} className="w-full h-56 object-cover" />
        </div>

        <div className="p-6 flex-1 flex flex-col">
          <div className="mb-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            {prod.calificacion > 0 && (
              <span className="inline-flex items-center gap-1 text-yellow-500">
                {"★".repeat(Math.round(prod.calificacion))}{"☆".repeat(5 - Math.round(prod.calificacion))}
              </span>
            )}
            {prod.calificacion > 0 && <span>{prod.calificacion.toFixed(1)} ({prod.numResenas})</span>}
          </div>
          <h3
            className="font-bold text-lg mb-1 cursor-pointer hover:text-emerald-600 transition"
            onClick={() => navigate(`/producto/${prod.id}`)}
          >
            {prod.nombre}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{prod.desc}</p>
          <p className="text-xs text-gray-400 mb-3">Vendido por: <span className="font-semibold text-gray-600 dark:text-gray-300">{prod.tienda.nombre}</span></p>

          <div className="flex items-center gap-3 mb-4">
            <span className="text-emerald-600 font-bold text-xl">{formatCOP(prod.precio)}</span>
            {prod.antes && <span className="line-through text-gray-400">{formatCOP(prod.antes)}</span>}
            {prod.descuento && <span className="bg-yellow-400 text-gray-900 text-xs font-bold px-2 py-1 rounded">{prod.descuento}</span>}
          </div>

          <div className="mt-auto space-y-2">
            <button
              onClick={() => handleAddToCart(prod)}
              className="w-full bg-emerald-600 text-white py-2 rounded-lg font-semibold hover:bg-emerald-700 transition relative"
            >
              {cartMsg === prod.id ? "✓ Agregado" : "Agregar al carrito"}
            </button>
            <button
              onClick={() => navigate(`/producto/${prod.id}`)}
              className="w-full border border-emerald-600 text-emerald-600 py-2 rounded-lg font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition"
            >
              Ver detalle
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="page-container">
      <Navbar />

      <section className="flex flex-col md:flex-row justify-between items-center px-8 md:px-16 py-20 min-h-[calc(100vh-80px)]" style={{ backgroundColor: "var(--color-bg)" }}>
        <div className="max-w-lg text-center md:text-left mr-8">
          <div className="text-accent mb-2 text-sm font-semibold uppercase tracking-wide">
            Bienvenidos a Lubix
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4 leading-tight" style={{ color: "var(--color-text)" }}>
            Tienda de Tecnología
          </h1>
          <p className="text-lg text-muted mb-6">
            Y <span className="font-bold text-accent">50% de descuento</span> en productos seleccionados
          </p>
        </div>

        <div className="w-72 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex-shrink-0 hover:border-green-500/40 transition-all">
          <img
            src={OFERTAS[index].imagen}
            alt={OFERTAS[index].titulo}
            className="w-full h-44 object-cover"
          />
          <div className="p-5 text-center">
            <p className="text-green-500 text-xs font-bold uppercase tracking-widest mb-1">
              {OFERTAS[index].titulo}
            </p>
            <p className="text-slate-400 text-sm mb-4">
              {OFERTAS[index].descripcion}
            </p>
            <button
              onClick={() => {
                if (productos.length > 0) {
                  navigate(`/producto/${productos[index % productos.length].id}`);
                } else {
                  navigate("/buscar");
                }
              }}
              className="inline-block bg-green-500 hover:bg-green-400 text-white text-xs font-bold px-5 py-2 rounded-full transition-all"
            >
              Comprar ahora
            </button>
          </div>
        </div>
      </section>

      <section className="card">
        <h2 className="text-3xl font-bold mb-10 text-center text-emerald-700 dark:text-emerald-400">Productos Destacados</h2>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
            <p className="text-muted mt-4">Cargando productos...</p>
          </div>
        ) : productos.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <span className="block text-3xl mb-2">📦</span>
            <p className="font-medium">No hay productos disponibles</p>
            <p className="text-sm mt-1">Aún no se han agregado productos a la tienda.</p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-3 gap-8">
              {productos.slice(0, 3).map(renderProducto)}
            </div>
            {productos.length > 3 && (
              <div className="grid md:grid-cols-3 gap-8 mt-12">
                {productos.slice(3, 6).map(renderProducto)}
              </div>
            )}
          </>
        )}
      </section>

      {showToast && (
        <div className="fixed bottom-6 right-6 z-[60] flex items-center gap-3 bg-emerald-600 text-white px-5 py-4 rounded-xl shadow-2xl animate-bounce">
          <CheckCircleIcon className="w-7 h-7" />
          <div>
            <p className="font-bold text-sm">Agregado al carrito</p>
            <p className="text-xs opacity-90 max-w-[220px] truncate">{toastName}</p>
          </div>
          <button
            onClick={() => navigate("/carrito")}
            className="ml-2 flex items-center gap-1 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
          >
            <ShoppingCartIcon className="w-4 h-4" /> Ver carrito
          </button>
        </div>
      )}

      {showAuthFav && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4" onClick={() => setShowAuthFav(false)}>
          <div
            className="w-full max-w-md rounded-2xl p-8 text-center shadow-2xl"
            style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center bg-pink-500/10">
              <HeartSolid className="w-8 h-8 text-pink-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--color-text)" }}>Debes iniciar sesión</h2>
            <p className="mb-6" style={{ color: "var(--color-muted)" }}>
              Para guardar productos en favoritos necesitas una cuenta. Regístrate gratis y sigue explorando.
            </p>
            <div className="space-y-3">
              <Link
                to="/login"
                className="block w-full bg-pink-500 hover:bg-pink-400 text-white py-3 rounded-xl font-semibold transition"
              >
                Iniciar sesión
              </Link>
              <Link
                to="/register"
                className="block w-full border border-pink-500 text-pink-500 py-3 rounded-xl font-semibold transition"
              >
                Registrarme
              </Link>
              <button
                onClick={() => setShowAuthFav(false)}
                className="w-full py-2 text-sm hover:underline"
                style={{ color: "var(--color-muted)" }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default Home;
