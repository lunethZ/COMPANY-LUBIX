import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import NavbarAuto from "../components/navbar-auto";
import Footer from "../components/footer";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import api from "../api/axios";
import { errorDetailMessage } from "../utils/errors";
import {
  HeartIcon as HeartOutline,
  StarIcon,
  ShoppingBagIcon,
  ShieldCheckIcon,
  TruckIcon,
  ArrowLeftIcon,
  CheckBadgeIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string;
  created_at: string;
  user_name: string;
}

interface ProductDetail {
  id: string;
  name: string;
  price: number;
  images: string[];
  descripcion: string;
  stock: number;
  discount_enable: boolean;
  discount_value: number;
  company_id: string;
  company_name: string;
  technical_spec: Record<string, string> | null;
  avg_rating: number;
  review_count: number;
}

const Estrellas = ({ valor, className = "w-4 h-4" }: { valor: number; className?: string }) => {
  const rounded = Math.round(valor);
  return (
    <span className="inline-flex items-center gap-0.5 text-yellow-500">
      {Array.from({ length: 5 }).map((_, i) => (
        <StarIcon key={i} className={`${className} ${i < rounded ? "fill-yellow-400 text-yellow-400" : "text-gray-300 dark:text-gray-600"}`} />
      ))}
    </span>
  );
};

const EstrellasEditables = ({
  valor,
  onChange,
}: {
  valor: number;
  onChange: (v: number) => void;
}) => {
  const [hover, setHover] = useState(0);
  return (
    <span className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          className="cursor-pointer transition-transform hover:scale-110"
        >
          <StarIcon
            className={`w-7 h-7 ${
              n <= (hover || valor)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300 dark:text-gray-600"
            }`}
          />
        </button>
      ))}
    </span>
  );
};

const formatCOP = (value: number) =>
  "$" + value.toLocaleString("es-CO", { maximumFractionDigits: 0 });

export const resolveImage = (img?: string) => {
  if (!img || img === "/placeholder.png") return "/placeholder.png";
  if (img.startsWith("http://") || img.startsWith("https://")) return img;
  const base = (import.meta.env.VITE_API_URL || "http://localhost:8002").replace(/\/$/, "");
  const path = img.startsWith("/files") ? img : img.startsWith("/") ? `/files${img}` : `/files/${img}`;
  return `${base}${path.replace("/files/files", "/files")}`;
};

const ProductoDetalle: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart, items } = useCart();
  const [activeImage, setActiveImage] = useState(0);
  const [cartMsg, setCartMsg] = useState(false);
  const [producto, setProducto] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [quantity, setQuantity] = useState(1);

  const [reviewForm, setReviewForm] = useState({ rating: 0, title: "", comment: "" });
  const [reviewMsg, setReviewMsg] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      api.get(`/products/${id}`),
      api.get(`/products/${id}/reviews`).catch(() => ({ data: [] })),
      api.get(`/products/${id}/related`).catch(() => ({ data: { products: [] } })),
    ])
      .then(([prodRes, revRes, relRes]) => {
        setProducto(prodRes.data);
        setReviews(revRes.data || []);
        setRelatedProducts(relRes.data?.products || []);
      })
      .catch(() => setNotFound(true))
      .finally(() => {
        setLoading(false);
        setReviewsLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (!id || !user) return;
    api
      .get("/user/favorites")
      .then((res) => {
        const favIds = (res.data || []).map((f: any) => String(f.product?.id));
        setIsFav(favIds.includes(String(id)));
      })
      .catch(() => {});
  }, [id, user]);

  if (loading) {
    return (
      <div className="page-container min-h-screen">
        <NavbarAuto />
        <div className="max-w-xl mx-auto px-4 py-24 text-center">
          <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-muted mt-4">Cargando producto...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (notFound || !producto) {
    return (
      <div className="page-container min-h-screen">
        <NavbarAuto />
        <div className="max-w-xl mx-auto px-4 py-24 text-center">
          <ShoppingBagIcon className="w-20 h-20 mx-auto mb-5 opacity-30" />
          <h1 className="text-3xl font-bold mb-3">Producto no encontrado</h1>
          <p className="text-muted mb-8">
            El producto que buscas no existe o ya no está disponible.
          </p>
          <button
            onClick={() => navigate("/home-usuario")}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-semibold transition"
          >
            Volver al inicio
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const handleFavorite = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      const res = await api.post(`/user/favorites/${producto.id}`);
      setIsFav(res.data.is_favorite);
    } catch {
      /* ignore */
    }
  };

  const handleAddToCart = () => {
    if (!producto) return;
    void addToCart({
      id: producto.id,
      name: producto.name,
      price: producto.price,
      image: producto.images?.[0] || "/placeholder.png",
      stock: producto.stock,
      quantity,
    });
    setCartMsg(true);
    setTimeout(() => setCartMsg(false), 1500);
  };

  const handleSubmitReview = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (reviewForm.rating === 0) {
      setReviewMsg("Selecciona una calificación");
      return;
    }
    if (!reviewForm.comment.trim()) {
      setReviewMsg("Escribe un comentario");
      return;
    }

    setSubmittingReview(true);
    setReviewMsg("");
    try {
      const res = await api.post(`/products/${producto.id}/reviews`, {
        rating: reviewForm.rating,
        title: reviewForm.title || undefined,
        comment: reviewForm.comment,
      });
      setReviewMsg("Reseña publicada correctamente");
      setReviewForm({ rating: 0, title: "", comment: "" });

      const revRes = await api.get(`/products/${producto.id}/reviews`);
      setReviews(revRes.data || []);

      setProducto((prev) =>
        prev
          ? {
              ...prev,
              avg_rating:
                ((prev.avg_rating * prev.review_count + reviewForm.rating) /
                  (prev.review_count + 1)),
              review_count: prev.review_count + 1,
            }
          : prev
      );
    } catch (err: any) {
      setReviewMsg(
        errorDetailMessage(err, "Error al publicar la reseña")
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  const finalPrice =
    producto.discount_enable && producto.discount_value > 0
      ? producto.price - (producto.price * producto.discount_value) / 100
      : producto.price;

  const specs = producto.technical_spec
    ? Object.entries(producto.technical_spec).map(([label, value]) => ({
        label,
        value: String(value),
      }))
    : [];

  const images = producto.images?.length
    ? producto.images
    : ["/placeholder.png"];

  const ratingBreakdown = () => {
    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const key = Math.max(1, Math.min(5, Math.round(r.rating)));
      counts[key] += 1;
    });
    const total = reviews.length || 1;
    return [5, 4, 3, 2, 1].map((n) => ({
      star: n,
      pct: Math.round(((counts[n] || 0) / total) * 100),
      count: counts[n] || 0,
    }));
  };

  return (
    <div className="page-container">
      <NavbarAuto />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-accent transition"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Volver
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
          <div>
            <div className="rounded-2xl overflow-hidden border bg-white dark:bg-slate-900 mb-4">
              <img
                src={resolveImage(images[activeImage])}
                alt={producto.name}
                className="w-full h-96 object-cover"
              />
            </div>
            {images.length > 1 && (
              <div className="flex gap-3">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition ${
                      activeImage === i
                        ? "border-emerald-500"
                        : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={resolveImage(img)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <h1 className="text-3xl font-extrabold mb-3">{producto.name}</h1>

            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex items-center gap-1 text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                <CheckBadgeIcon className="w-3.5 h-3.5" /> Verificado
              </span>
            </div>

            {producto.review_count > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <Estrellas valor={producto.avg_rating} />
                <span className="text-sm font-semibold">
                  {producto.avg_rating.toFixed(1)}
                </span>
                <span className="text-sm text-muted">
                  ({producto.review_count} reseñas)
                </span>
              </div>
            )}

            <p className="text-muted mb-6 leading-relaxed">
              {producto.descripcion}
            </p>

            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {formatCOP(finalPrice)}
              </span>
              {producto.discount_enable && producto.discount_value > 0 && (
                <>
                  <span className="text-xl text-muted line-through">
                    {formatCOP(producto.price)}
                  </span>
                  <span className="bg-yellow-400 text-gray-900 text-sm font-bold px-2.5 py-1 rounded-lg">
                    -{producto.discount_value}%
                  </span>
                </>
              )}
            </div>
            <p className="text-xs text-muted mb-6">
              IVA incluido ·{" "}
              <span
                className={
                  producto.stock > 0
                    ? "text-emerald-600 font-semibold"
                    : "text-red-500 font-semibold"
                }
              >
                {producto.stock > 0
                  ? `${producto.stock} disponibles`
                  : "Agotado"}
              </span>
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <button
                onClick={handleAddToCart}
                disabled={producto.stock <= 0}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2"
              >
                <ShoppingBagIcon className="w-5 h-5" />
                {cartMsg ? "✓ Agregado al carrito" : "Agregar al carrito"}
              </button>
              <button
                onClick={handleFavorite}
                className="px-5 py-3 rounded-xl border border-gray-300 dark:border-gray-700 font-semibold transition hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center justify-center gap-2"
              >
                {isFav ? (
                  <HeartSolid className="w-5 h-5 text-pink-500" />
                ) : (
                  <HeartOutline className="w-5 h-5" />
                )}
                {isFav ? "Guardado" : "Guardar"}
              </button>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm text-muted">Cantidad:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-lg border border-gray-300 dark:border-gray-700 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-800"
                >
                  −
                </button>
                <span className="w-10 text-center font-bold">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => Math.min(producto.stock || 99, q + 1))}
                  className="w-8 h-8 rounded-lg border border-gray-300 dark:border-gray-700 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-800"
                >
                  +
                </button>
              </div>
              <span className="text-xs text-muted">{producto.stock} disponibles</span>
            </div>

            <button
              onClick={() => {
                const alreadyInCart = items.some(i => String(i.product_id) === String(producto.id) || String(i.id) === String(producto.id));
                if (!alreadyInCart) handleAddToCart();
                setTimeout(() => navigate("/pago"), 300);
              }}
              disabled={producto.stock <= 0}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-3 rounded-xl font-bold text-lg transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <ShoppingBagIcon className="w-5 h-5" />
              Comprar
            </button>
          </div>
        </div>

        <section className="card mb-12 !hover:translate-y-0">
          <h2 className="text-2xl font-bold mb-6">
            Tienda que vende este producto
          </h2>
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-500 to-green-700 text-white flex items-center justify-center text-2xl font-extrabold shadow-lg">
              {(producto.company_name || "T").charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <h3 className="text-xl font-bold">{producto.company_name}</h3>
                <span className="inline-flex items-center gap-1 text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                  <CheckBadgeIcon className="w-3.5 h-3.5" /> Tienda verificada
                </span>
              </div>
            </div>
          </div>
        </section>

        {specs.length > 0 && (
          <section className="card mb-12">
            <h2 className="text-2xl font-bold mb-6">
              Características y detalles
            </h2>
            <dl className="divide-y divide-gray-100 dark:divide-gray-800">
              {specs.map((c) => (
                <div
                  key={c.label}
                  className="py-3 flex items-start justify-between gap-6"
                >
                  <dt className="text-sm text-muted shrink-0">{c.label}</dt>
                  <dd className="text-sm font-semibold text-right">
                    {c.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <section className="card mb-12">
          <h2 className="text-2xl font-bold mb-6">
            Opiniones y Reseñas
          </h2>

          {producto.review_count > 0 && (
            <div className="flex flex-col md:flex-row gap-8 mb-8 pb-8 border-b border-gray-100 dark:border-gray-800">
              <div className="flex flex-col items-center justify-center">
                <span className="text-5xl font-extrabold">
                  {producto.avg_rating.toFixed(1)}
                </span>
                <Estrellas
                  valor={producto.avg_rating}
                  className="w-5 h-5 mt-2"
                />
                <span className="text-sm text-muted mt-1">
                  {producto.review_count} reseñas
                </span>
              </div>
              <div className="flex-1 space-y-2">
                {ratingBreakdown().map((b) => (
                  <div
                    key={b.star}
                    className="flex items-center gap-3 text-sm"
                  >
                    <span className="text-muted w-12">{b.star} ★</span>
                    <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-yellow-400 h-2.5 rounded-full transition-all"
                        style={{ width: `${b.pct}%` }}
                      />
                    </div>
                    <span className="text-muted w-16 text-right">
                      {b.pct}% ({b.count})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {user && (
            <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-6 mb-8">
              <h3 className="text-lg font-bold mb-4">
                Escribe tu reseña
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                  Calificación
                </label>
                <EstrellasEditables
                  valor={reviewForm.rating}
                  onChange={(v) =>
                    setReviewForm((prev) => ({ ...prev, rating: v }))
                  }
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">
                  Título (opcional)
                </label>
                <input
                  type="text"
                  value={reviewForm.title}
                  onChange={(e) =>
                    setReviewForm((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  placeholder="Ej: Muy buen producto"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">
                  Comentario <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={3}
                  value={reviewForm.comment}
                  onChange={(e) =>
                    setReviewForm((prev) => ({
                      ...prev,
                      comment: e.target.value,
                    }))
                  }
                  placeholder="Cuéntanos tu experiencia con el producto..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-emerald-500 transition resize-none"
                />
              </div>
              {reviewMsg && (
                <p
                  className={`text-sm mb-3 ${
                    reviewMsg.includes("correctamente")
                      ? "text-emerald-600"
                      : "text-red-500"
                  }`}
                >
                  {reviewMsg}
                </p>
              )}
              <button
                onClick={handleSubmitReview}
                disabled={
                  submittingReview ||
                  reviewForm.rating === 0 ||
                  !reviewForm.comment.trim()
                }
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-semibold transition"
              >
                {submittingReview ? "Enviando..." : "Publicar reseña"}
              </button>
            </div>
          )}

          {!user && (
            <div className="text-center py-6 mb-8 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
              <p className="text-muted mb-3">
                Inicia sesión para dejar tu reseña
              </p>
              <button
                onClick={() => navigate("/login")}
                className="text-emerald-600 hover:text-emerald-700 font-semibold underline"
              >
                Iniciar sesión
              </button>
            </div>
          )}

          {reviewsLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12 text-muted">
              <p className="font-medium">Aún no hay reseñas</p>
              <p className="text-sm mt-1">
                Sé el primero en opinar sobre este producto
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((r) => (
                <div
                  key={r.id}
                  className="border border-gray-100 dark:border-gray-800 rounded-xl p-5"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold text-sm">
                        {r.user_name?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{r.user_name}</p>
                        <Estrellas valor={r.rating} className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <span className="text-xs text-muted">
                      {new Date(r.created_at).toLocaleDateString("es-CO", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  {r.title && (
                    <p className="font-semibold text-sm mt-2">{r.title}</p>
                  )}
                  <p className="text-sm text-muted mt-1 leading-relaxed">
                    {r.comment}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ProductoDetalle;
