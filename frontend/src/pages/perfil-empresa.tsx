import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import NavbarAuto from "../components/navbar-auto";
import api from "../api/axios";
import { StarIcon, CubeIcon, CheckBadgeIcon } from "@heroicons/react/24/outline";

interface CompanyProfile {
  id: string;
  name: string;
  address: string;
  logo: string | null;
  banner: string | null;
  member_at: string;
  total_sales: number;
  avg_rating: number;
  total_reviews: number;
  total_products: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
  stock: number;
  discount_enable: boolean;
  discount_value: number;
  avg_rating: number;
}

const REFERENCE_IMAGE = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop";

const resolveImageUrl = (img?: string) => {
  if (!img) return REFERENCE_IMAGE;
  if (img.startsWith("http://") || img.startsWith("https://")) return img;
  const base = (import.meta.env.VITE_API_URL || "http://localhost:8002").replace(/\/$/, "");
  const path = img.startsWith("/files") ? img : `/files/${img.replace(/^\/+/, "")}`;
  return `${base}${path.replace("/files/files", "/files")}`;
};

export default function PerfilEmpresa() {
  const { id } = useParams<{ id: string }>();
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [profileRes, searchRes] = await Promise.all([
          api.get(`/products/company/${id}/profile`),
          api.get("/products/search", { params: { q: "", company_id: id } }),
        ]);
        setCompany(profileRes.data);
        setProducts(searchRes.data?.products || []);
      } catch (err) {
        console.error("Error fetching company profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950">
        <NavbarAuto />
        <div className="flex items-center justify-center py-32">
          <div className="w-10 h-10 border-4 border-slate-700 border-t-green-500 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-slate-950">
        <NavbarAuto />
        <div className="flex flex-col items-center justify-center py-32 text-white">
          <h2 className="text-2xl font-bold mb-4">Empresa no encontrada</h2>
          <Link to="/buscar" className="text-green-400 hover:text-green-300 transition">Volver a buscar</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <NavbarAuto />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        <div
          className="relative rounded-2xl p-8 mb-8 shadow-xl shadow-green-500/20 overflow-hidden"
          style={company.banner ? { backgroundImage: `url(${resolveImageUrl(company.banner)})`, backgroundSize: "cover", backgroundPosition: "center" } : { background: "linear-gradient(to right, #16a34a, #2563eb)" }}
        >
          {company.banner && <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"></div>}
          <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center text-4xl font-bold text-green-500 shadow-lg border-4 border-white/20 overflow-hidden">
              {company.logo ? (
                <img src={resolveImageUrl(company.logo)} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                company.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start mb-1">
                <h1 className="text-3xl font-bold text-white">{company.name}</h1>
                <CheckBadgeIcon className="w-6 h-6 text-green-400" />
              </div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-green-100 mt-2">
                <div className="flex items-center gap-1">
                  <StarIcon className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{company.avg_rating > 0 ? company.avg_rating : "Sin calificación"}</span>
                  <span className="text-sm">({company.total_reviews} reseñas)</span>
                </div>
                <div className="flex items-center gap-1">
                  <CubeIcon className="w-4 h-4" />
                  <span>{company.total_sales} ventas</span>
                </div>
                <div className="text-sm">{company.total_products} productos</div>
                <div className="text-sm">Miembro desde {new Date(company.member_at).toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-xl font-bold text-white mb-6">Productos de {company.name} <span className="text-gray-500 font-normal text-base">({products.length})</span></h2>

        {products.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p>Esta empresa aún no tiene productos publicados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {products.map((product) => {
              const finalPrice = product.discount_enable
                ? product.price * (1 - product.discount_value / 100)
                : product.price;
              return (
                <Link
                  key={product.id}
                  to={`/producto/${product.id}`}
                  className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300 group"
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={product.images?.[0] ? resolveImageUrl(product.images[0]) : REFERENCE_IMAGE}
                      alt={product.name}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {product.discount_enable && (
                      <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
                        -{product.discount_value}%
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-white font-semibold text-sm mb-2 line-clamp-2">{product.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-green-400 font-bold text-lg">${finalPrice.toLocaleString()}</span>
                      {product.discount_enable && (
                        <span className="text-gray-500 line-through text-sm">${product.price.toLocaleString()}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
                      <span>{product.stock} disponibles</span>
                      <div className="flex items-center gap-1">
                        <StarIcon className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                        <span>{product.avg_rating > 0 ? product.avg_rating : "Sin"}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
