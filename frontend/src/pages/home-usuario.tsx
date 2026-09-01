import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavbarUsuario from "../components/navbaruser";
import Footer from "../components/footer";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import api from "../api/axios";
import { HeartIcon as HeartOutline } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import {DevicePhoneMobileIcon,ComputerDesktopIcon,SpeakerWaveIcon,CameraIcon,ClockIcon}from "@heroicons/react/24/outline"

interface Producto {
  id: string;
  nombre: string;
  desc: string;
  precio: number;
  antes: number | null;
  descuento: string | null;
  imagen: string;
  tienda: { nombre: string };
  calificacion: number;
  numResenas: number;
}

const OFERTAS = [
  { titulo: "Oferta 1", descripcion: "Hasta 40% en laptops", color: "bg-gradient-to-tr from-emerald-500 to-green-700 text-white", imagen: "/portatil.png" },
  { titulo: "Oferta 2", descripcion: "Smartphones con 30% de descuento", color: "bg-gradient-to-tr from-emerald-950 to-gray-900 text-white", imagen: "/iphone.png" },
  { titulo: "Oferta 3", descripcion: "Accesorios 2x1", color: "bg-gradient-to-tr from-emerald-500 to-green-700 text-white", imagen: "/televisor.png" },
];

const formatCOP = (value: number) => {
  return "$" + value.toLocaleString("es-CO", { maximumFractionDigits: 0 });
};

const resolveImage = (img?: string) => {
  if (!img || img === "/placeholder.png") return "/placeholder.png";
  if (img.startsWith("http://") || img.startsWith("https://")) return img;
  const base = (import.meta.env.VITE_API_URL || "http://localhost:8002").replace(/\/$/, "");
  const path = img.startsWith("/files") ? img : img.startsWith("/") ? `/files${img}` : `/files/${img}`;
  return `${base}${path.replace("/files/files", "/files")}`;
};

const GamepadIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={props.className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 9h2m-1-1v2m7-1h2m-1-1v2m-6 6h6a5 5 0 005-5V9a5 5 0 00-5-5H9a5 5 0 00-5 5v2a5 5 0 005 5z" />
  </svg>
);

const HomeUsuario: React.FC = () => {
  const [index, setIndex] = useState(0);
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [cartMsg, setCartMsg] = useState<string | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);

  const carouselProducts = (() => {
    const withImage = productos.filter((p) => p.imagen && p.imagen !== "/placeholder.png");
    return (withImage.length >= 3 ? withImage : productos).slice(0, 3);
  })();

  useEffect(() => {
    if (carouselProducts.length === 0) return;
    const interval = setInterval(() => setIndex((prev) => (prev + 1) % carouselProducts.length), 3000);
    return () => clearInterval(interval);
  }, [carouselProducts.length]);

  useEffect(() => {
    api.get("/products/search")
      .then((res) => {
        const items = (res.data.products || []).map((p: any) => ({
          id: p.id,
          nombre: p.name,
          desc: p.descripcion,
          precio: p.price,
          antes: null,
          descuento: p.discount_enable && p.discount_value > 0 ? `-${p.discount_value}%` : null,
          imagen: p.images?.[0] || "/placeholder.png",
          imagenes: p.images?.length ? p.images : ["/placeholder.png"],
          categoria: "General",
          stock: p.stock,
          tienda: { nombre: p.company_name || "Tienda", logo: (p.company_name || "T").charAt(0), direccion: "", ciudad: "", calificacion: 0, numResenas: 0, ventas: 0, miembrosDesde: "" },
          calificacion: p.avg_rating || 0,
          numResenas: p.review_count || 0,
          caracteristicas: [],
          reseñas: [],
        }));
        setProductos(items);
      })
      .catch(() => setProductos([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    api.get("/user/favorites")
      .then((res) => {
        const ids = new Set<string>((res.data || []).map((f: any) => String(f.product?.id)));
        setFavorites(ids);
      })
      .catch(() => {});
  }, [user]);

  const handleFavorite = async (id: string) => {
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      const res = await api.post(`/user/favorites/${id}`);
      setFavorites((prev) => {
        const next = new Set(prev);
        if (res.data.is_favorite) {
          next.add(String(id));
        } else {
          next.delete(String(id));
        }
        return next;
      });
    } catch {
      /* ignore */
    }
  };

  const handleAddToCart = (prod: Producto) => {
    if (!user) {
      navigate("/login");
      return;
    }
    void addToCart({
      id: prod.id,
      name: prod.nombre,
      price: prod.precio,
      image: prod.imagen,
    });
    setCartMsg(prod.id);
    setTimeout(() => setCartMsg(null), 1500);
  };

  const renderProducto = (prod: Producto) => {
    const isFav = favorites.has(String(prod.id));
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
          <img src={resolveImage(prod.imagen)} alt={prod.nombre} className="w-full h-56 object-cover" />
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
      <NavbarUsuario />

      <section className="flex flex-col md:flex-row justify-between items-center px-8 md:px-16 py-20 min-h-[calc(100vh-80px)]" style={{ backgroundColor: "var(--color-bg)" }}>
        <div className="max-w-lg text-center md:text-left mr-8">
          <div className="text-accent mb-2 text-sm font-semibold uppercase tracking-wide">Bienvenido {user?.name || "Usuario"}</div>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4 leading-tight" style={{ color: "var(--color-text)" }}>Bienvenido de nuevo a Lubix</h1>
          <p className="text-lg text-muted mb-6">Explora productos de las mejores tiendas de manera rápida y sencilla.</p>
        </div>

        <div className="mt-10 md:mt-0 w-[420px] h-[500px] rounded-3xl shadow-2xl overflow-hidden flex flex-col items-center justify-between transform transition-all duration-700 ease-in-out hover:scale-105 cursor-pointer" style={{ backgroundColor: "var(--color-bg-card)" }} onClick={() => carouselProducts.length > 0 && navigate(`/producto/${carouselProducts[index]?.id}`)}>
          {loading ? (
            <div className="w-full h-full flex flex-col items-center justify-center p-8">
              <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
              <p className="text-muted">Cargando productos...</p>
            </div>
          ) : carouselProducts.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
              <span className="text-5xl mb-4">📦</span>
              <h2 className="text-xl font-bold mb-2" style={{ color: "var(--color-text)" }}>No hay productos</h2>
              <p className="text-sm text-muted">Aún no hay productos publicados por las empresas</p>
            </div>
          ) : (
            <>
              <img src={resolveImage(carouselProducts[index].imagen)} alt={carouselProducts[index].nombre} className="w-full h-64 object-cover" />
              <div className="w-full flex-1 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-tr from-emerald-500 to-green-700 text-white">
                <h2 className="text-xl font-bold mb-1 line-clamp-2">{carouselProducts[index].nombre}</h2>
                <p className="text-lg font-extrabold mb-2">{formatCOP(carouselProducts[index].precio)}</p>
                <p className="text-xs opacity-80">Click para ver detalle</p>
                <div className="flex gap-2 mt-3">
                  {carouselProducts.map((_, i) => (
                    <div key={i} className={`w-2 h-2 rounded-full transition ${i === index ? 'bg-white' : 'bg-white/40'}`} />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </section>



      <section className="card">
        <h2 className="text-3xl font-bold mb-10 text-center">Categorías Principales</h2>
        <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-6">
          {[
            { nombre: "Computadores", icono: <ComputerDesktopIcon className="w-10 h-10" /> },
            { nombre: "Smartphones", icono: <DevicePhoneMobileIcon className="w-10 h-10" /> },
            { nombre: "Audio", icono: <SpeakerWaveIcon className="w-10 h-10" /> },
            { nombre: "Fotografía", icono: <CameraIcon className="w-10 h-10" /> },
            { nombre: "Gaming", icono: <GamepadIcon className="w-10 h-10" /> },
            { nombre: "Accesorios", icono: <ClockIcon className="w-10 h-10" /> },
          ].map((cat) => (
            <button
              key={cat.nombre}
              onClick={() => navigate(`/buscar?categoria=${encodeURIComponent(cat.nombre)}`)}
              className="card hover:border-emerald-500/40 hover:shadow-lg hover:-translate-y-1 transition cursor-pointer text-center"
            >
              <div className="text-4xl mb-3 flex justify-center">{cat.icono}</div>
              <h3 className="font-semibold text-lg">{cat.nombre}</h3>
              <p className="text-xs text-muted mt-1">Ver catálogo →</p>
            </button>
          ))}
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
      <Footer />
    </div>
  );
};

export default HomeUsuario;
