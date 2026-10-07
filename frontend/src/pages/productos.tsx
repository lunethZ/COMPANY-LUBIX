import { useState, useEffect } from 'react';
import NavbarEmpresa from '../components/navbar-empresa';
import api from '../api/axios';

interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string;
  created_at: string;
  user_name: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
  stock: number;
  descripcion: string;
  technical_spec: string;
  discount_enable: boolean;
  discount_value: number;
}

interface ProductDetail extends Product {
  avg_rating: number;
  review_count: number;
}

const REFERENCE_IMAGE = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop';

const resolveImage = (img?: string) => {
  if (!img || img === '/placeholder.png') return '/placeholder.png';
  if (img.startsWith('http://') || img.startsWith('https://')) return img;
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:8002').replace(/\/$/, '');
  const path = img.startsWith('/files') ? img : img.startsWith('/') ? `/files${img}` : `/files/${img}`;
  return `${base}${path.replace('/files/files', '/files')}`;
};

const formatCOP = (valor: number) => {
  return valor.toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  });
};

export default function ProductosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/company/products');
      setProducts(res.data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProduct = async (product: Product) => {
    setLoadingDetail(true);
    setSelectedProduct(null);
    setReviews([]);
    try {
      const [detailRes, reviewsRes] = await Promise.all([
        api.get(`/products/${product.id}`),
        api.get(`/products/${product.id}/reviews`).catch(() => ({ data: [] })),
      ]);
      setSelectedProduct(detailRes.data);
      setReviews(reviewsRes.data || []);
    } catch (err) {
      console.error('Error fetching product detail:', err);
      setSelectedProduct({
        ...product,
        avg_rating: 0,
        review_count: 0,
      });
    } finally {
      setLoadingDetail(false);
    }
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.descripcion.toLowerCase().includes(busqueda.toLowerCase())
  );

  if (loadingDetail) {
    return (
      <>
        <NavbarEmpresa />
        <div className="p-6 bg-[#030712] text-slate-100 min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </>
    );
  }

  if (selectedProduct) {
    const p = selectedProduct;
    return (
      <>
        <NavbarEmpresa />
        <div className="p-6 bg-[#030712] text-slate-100 min-h-screen">
          <button
            onClick={() => setSelectedProduct(null)}
            className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-2 mb-6 text-sm transition-colors cursor-pointer"
          >
            ← Volver al listado de productos
          </button>

          <div className="bg-[#1f2937] p-6 rounded-xl shadow-md border border-slate-700 flex flex-col md:flex-row gap-6 mb-6">
            <img
              src={resolveImage(p.images?.[0]) || REFERENCE_IMAGE}
              alt={p.name}
              className="w-full md:w-48 h-48 object-cover rounded-lg"
              onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
            />
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">{p.name}</h2>
                <p className="text-xl font-semibold text-emerald-400 mt-1">{formatCOP(p.price)}</p>
                {p.descripcion && (
                  <p className="text-sm text-slate-400 mt-2">{p.descripcion}</p>
                )}
              </div>
              <div className="flex items-center gap-4 mt-4 md:mt-0 pt-4 border-t border-slate-700">
                <div className="text-sm">
                  <span className="text-slate-400">Stock actual:</span>{' '}
                  <span className="font-semibold text-slate-200">{p.stock} unidades</span>
                </div>
                <div className="text-sm flex items-center gap-1 bg-amber-950/40 px-2 py-1 rounded text-amber-400 font-medium border border-amber-900/50">
                  ⭐ {p.avg_rating > 0 ? p.avg_rating.toFixed(1) : 'Sin calificación'} / 5.0
                </div>
                <div className="text-sm text-slate-400">
                  {p.review_count} reseña{p.review_count !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#1f2937] p-6 rounded-xl shadow-md border border-slate-700 mb-8">
            <h3 className="text-lg font-bold text-white mb-4">Reseñas de Clientes</h3>
            {reviews.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-6">Este producto aún no tiene reseñas.</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="p-4 bg-[#111827] rounded-lg border border-slate-700">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h5 className="text-sm font-semibold text-slate-200">{review.user_name}</h5>
                        <span className="text-[11px] text-slate-400">
                          {new Date(review.created_at).toLocaleDateString('es-CO')}
                        </span>
                      </div>
                      <div className="text-amber-400 text-xs font-bold bg-[#1f2937] px-2 py-0.5 rounded shadow-sm border border-slate-600">
                        {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                      </div>
                    </div>
                    {review.title && (
                      <h6 className="text-sm font-medium text-slate-300 mb-1">{review.title}</h6>
                    )}
                    <p className="text-sm text-slate-300 italic">"{review.comment}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <NavbarEmpresa />
      <div className="p-6 bg-[#030712] text-slate-100 min-h-screen">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Catálogo de Productos</h1>
            <p className="text-sm text-slate-400">Haz clic en un producto para ver sus reseñas y detalles.</p>
          </div>
        </div>

        <div className="bg-[#1f2937] p-4 rounded-xl shadow-md mb-6 flex items-center border border-slate-700">
          <input
            type="text"
            placeholder="Buscar producto por nombre o descripción..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full max-w-sm px-3 py-2 bg-[#111827] border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-500"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((producto) => (
                <div
                  key={producto.id}
                  className="bg-[#1f2937] rounded-xl shadow-md border border-slate-700 overflow-hidden flex flex-col justify-between hover:shadow-lg hover:border-slate-600 transition-all"
                >
                  <div className="relative h-44 bg-slate-900 border-b border-slate-700">
                    <img
                      src={resolveImage(producto.images?.[0]) || REFERENCE_IMAGE}
                      alt={producto.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
                    />
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-200 text-base mb-1 line-clamp-1">
                        {producto.name}
                      </h3>
                      <p className="text-base font-bold text-emerald-400 mb-4">
                        {formatCOP(producto.price)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleSelectProduct(producto)}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 px-4 rounded-lg text-xs transition-colors text-center block cursor-pointer border border-indigo-500"
                    >
                      Ver reseñas
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-12 bg-[#1f2937] rounded-xl border border-dashed border-slate-600 mt-6">
                <p className="text-slate-400 text-sm">
                  {products.length === 0
                    ? 'No tienes productos aún. Crea uno desde el dashboard.'
                    : 'No se encontraron productos coincidentes.'}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
