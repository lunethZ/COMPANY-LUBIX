import { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Navbar from "../components/navbar";
import NavbarUsuario from "../components/navbaruser";
import NavbarEmpresa from "../components/navbar-empresa";
import Footer from "../components/footer";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon,
} from "@heroicons/react/24/outline";

interface ProductResult {
  id: string;
  name: string;
  price: number;
  images: string[];
  descripcion: string;
  stock: number;
  discount_enable: boolean;
  discount_value: number;
  company_id: string;
  catalog_id?: string;
  company_name?: string;
}

const FALLBACK_CATEGORIES = [
  "Computadores",
  "Smartphones",
  "Audio",
  "Fotografía",
  "Gaming",
  "Tablets",
  "Accesorios",
];

const SORT_OPTIONS = [
  { value: "relevance", label: "Relevancia" },
  { value: "price_asc", label: "Precio: menor a mayor" },
  { value: "price_desc", label: "Precio: mayor a menor" },
  { value: "name_asc", label: "Nombre: A-Z" },
  { value: "name_desc", label: "Nombre: Z-A" },
];

function BuscarProducto() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const initialQuery = searchParams.get("q") || "";
  const initialCategory = searchParams.get("categoria") || "";
  const initialSort = searchParams.get("orden") || "relevance";

  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState(initialSort);
  const [minPrice, setMinPrice] = useState(searchParams.get("min") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("max") || "");
  const [results, setResults] = useState<ProductResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState<string[]>(FALLBACK_CATEGORIES);

  const userRole = user?.role_id;

  const getNavbar = () => {
    if (userRole === "user") return <NavbarUsuario />;
    if (userRole === "empresa") return <NavbarEmpresa />;
    return <Navbar />;
  };

  const buildSearchParams = useCallback(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    const cat = category?.trim();
    if (cat && cat.toLowerCase() !== "todas") params.set("categoria", cat);
    if (sortBy !== "relevance") params.set("orden", sortBy);
    if (minPrice) params.set("min", minPrice);
    if (maxPrice) params.set("max", maxPrice);
    return params;
  }, [query, category, sortBy, minPrice, maxPrice]);

  const doSearch = useCallback(async () => {
    setLoading(true);
    try {
      const params = buildSearchParams();
      setSearchParams(params, { replace: true });

      const res = await api.get("/products/search", { params });
      setResults(res.data.products || res.data || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [buildSearchParams, setSearchParams]);

  // Escuchar cambios directamente desde la URL (en caso de que el Navbar cambie el parámetro "q")
  useEffect(() => {
    const qParam = searchParams.get("q") || "";
    setQuery(qParam);
  }, [searchParams]);

  // Cargar categorías reales desde backend
  useEffect(() => {
    api.get("/products/catalogs").then(res => {
      const cats = (res.data || []).map((c: any) => c.name).filter(Boolean);
      if (cats.length) setCategories(cats);
    }).catch(() => {});
  }, []);

  // Disparar la búsqueda siempre (sin filtros muestra todos los productos de empresas)
  useEffect(() => {
    doSearch();
  }, [query, category, sortBy, minPrice, maxPrice, doSearch]);

  const clearFilters = () => {
    setCategory("");
    setSortBy("relevance");
    setMinPrice("");
    setMaxPrice("");
  };

  const formatPrice = (price: number) =>
    "$" + price.toLocaleString("es-CO");

  const getFinalPrice = (product: ProductResult) => {
    if (product.discount_enable && product.discount_value > 0) {
      return product.price - (product.price * product.discount_value) / 100;
    }
    return product.price;
  };

  const getDiscountLabel = (product: ProductResult) => {
    if (product.discount_enable && product.discount_value > 0) {
      return `-${product.discount_value}%`;
    }
    return null;
  };

  const hasActiveFilters = category || minPrice || maxPrice || sortBy !== "relevance";

  const resolveImage = (img?: string) => {
    if (!img || img === "/placeholder.png") return "/placeholder.png";
    if (img.startsWith("http://") || img.startsWith("https://")) return img;
    const base = (import.meta.env.VITE_API_URL || "http://localhost:8002").replace(/\/$/, "");
    const path = img.startsWith("/files") ? img : img.startsWith("/") ? `/files${img}` : `/files/${img}`;
    // Si ya es /files/products/... lo deja, si es products/... lo convierte
    if (path.startsWith("/files/files")) return `${base}${path.replace("/files/files", "/files")}`;
    return `${base}${path}`;
  };

  return (
    <div className="page-container">
      {getNavbar()}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Fila de controles: Filtros y Ordenamiento */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary flex items-center gap-2"
            >
              <AdjustmentsHorizontalIcon className="w-5 h-5" />
              Filtros
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
              )}
            </button>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-muted hover:text-accent transition flex items-center gap-1"
              >
                <XMarkIcon className="w-4 h-4" />
                Limpiar filtros
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-muted">Ordenar:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-base !w-auto py-2 text-sm"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-8">
          {showFilters && (
            <aside className="w-full sm:w-64 flex-shrink-0 space-y-6">
              <div className="card">
                <h3 className="font-semibold text-accent mb-3 flex items-center gap-2">
                  <FunnelIcon className="w-4 h-4" />
                  Categorías
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setCategory("")}
                    className={`block w-full text-left px-3 py-1.5 rounded-lg text-sm transition ${
                      !category
                        ? "bg-green-500/20 text-green-500 font-medium"
                        : "text-muted hover:text-accent hover:bg-green-500/10"
                    }`}
                  >
                    Todas
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`block w-full text-left px-3 py-1.5 rounded-lg text-sm transition ${
                        category === cat
                          ? "bg-green-500/20 text-green-500 font-medium"
                          : "text-muted hover:text-accent hover:bg-green-500/10"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="card">
                <h3 className="font-semibold text-accent mb-3">Rango de Precio</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="input-base py-2 text-sm"
                  />
                  <span className="text-muted">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="input-base py-2 text-sm"
                  />
                </div>
              </div>
            </aside>
          )}

          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin"></div>
                <p className="text-muted mt-4">Buscando productos...</p>
              </div>
            ) : results.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map((product) => (
                  <Link
                    key={product.id}
                    to={`/producto/${product.id}`}
                    className="card group !p-0 overflow-hidden hover:-translate-y-2"
                  >
                    <div className="relative h-52 overflow-hidden bg-gray-100 dark:bg-slate-800">
                      <img
                        src={resolveImage(product.images?.[0])}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {getDiscountLabel(product) && (
                        <span className="absolute top-3 left-3 bg-yellow-400 text-gray-900 text-xs font-bold px-2.5 py-1 rounded-lg">
                          {getDiscountLabel(product)}
                        </span>
                      )}
                      {product.stock <= 0 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white font-bold text-lg">Agotado</span>
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <p className="text-xs text-muted mb-1 uppercase tracking-wide">
                        {product.company_name || "Tienda"}
                      </p>
                      <h3 className="font-semibold text-base mb-2 line-clamp-2 group-hover:text-accent transition">
                        {product.name}
                      </h3>
                      <p className="text-sm text-muted mb-3 line-clamp-2">
                        {product.descripcion}
                      </p>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-accent font-bold text-lg">
                          {formatPrice(getFinalPrice(product))}
                        </span>
                        {product.discount_enable && product.discount_value > 0 && (
                          <span className="line-through text-muted text-sm">
                            {formatPrice(product.price)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted">
                        <span>
                          Stock: {product.stock > 0 ? product.stock : "Agotado"}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <MagnifyingGlassIcon className="w-16 h-16 text-muted mb-4" />
                <h2 className="text-xl font-semibold mb-2">Sin resultados</h2>
                <p className="text-muted max-w-md">
                  {query
                    ? `No encontramos productos para "${query}"${category ? ` en "${category}"` : ""}.`
                    : category
                    ? `No hay productos en la categoría "${category}".`
                    : "No hay productos disponibles."}
                  {hasActiveFilters ? " Intenta con otros filtros." : query ? " Prueba con otros términos." : category ? "" : " Las empresas aún no han publicado productos."}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default BuscarProducto;