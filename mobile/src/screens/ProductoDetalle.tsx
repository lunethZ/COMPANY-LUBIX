import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  useWindowDimensions,
  TextInput,
} from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { ProductCard } from "../components/ProductCard";
import { UserTopBar } from "../components/UserTopBar";
import { Stars, StarRatingEditable } from "../components/ui";
import { errorDetailMessage } from "../utils/errors";
import {
  getProduct,
  getRelatedProducts,
  getProductReviews,
  postReview,
} from "../api/products";
import { getFavorites, toggleFavorite } from "../api/user";
import { formatCOP, formatDate } from "../utils/format";
import { effectivePrice, discountPercent, specList } from "../types/product";
import type { Product, ProductReview } from "../types/product";
import type { RootStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, "ProductoDetalle">;

export default function ProductoDetalleScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { C } = useTheme();
  const { width } = useWindowDimensions();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [adding, setAdding] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  const [revRating, setRevRating] = useState(5);
  const [revTitle, setRevTitle] = useState("");
  const [revComment, setRevComment] = useState("");
  const [revBusy, setRevBusy] = useState(false);
  const [revError, setRevError] = useState("");
  const [revDone, setRevDone] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [prod, rel, revData] = await Promise.all([
          getProduct(route.params.id),
          getRelatedProducts(route.params.id).catch(() => []),
          getProductReviews(route.params.id).catch(() => []),
        ]);
        setProduct(prod);
        setRelated(rel);
        setReviews(revData);
        if (isAuthenticated) {
          const favs = await getFavorites().catch(() => []);
          setIsFavorite(favs.some((f) => f.product.id === prod.id));
        }
      } catch {
        // product not found
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params.id]);

  const handleFavorite = useCallback(async () => {
    if (!isAuthenticated) {
      navigation.navigate("Login");
      return;
    }
    try {
      const result = await toggleFavorite(route.params.id);
      setIsFavorite(result.is_favorite);
    } catch {
      // ignore
    }
  }, [isAuthenticated, route.params.id, navigation]);

  const handleAdd = async () => {
    if (!product || product.stock <= 0) return;
    setAdding(true);
    await addToCart(product, quantity);
    setAdding(false);
    navigation.navigate("Main", { screen: "Carrito" } as never);
  };

  const submitReview = async () => {
    if (!product) return;
    if (!isAuthenticated) {
      navigation.navigate("Login");
      return;
    }
    setRevBusy(true);
    setRevError("");
    try {
      await postReview(product.id, {
        rating: revRating,
        title: revTitle.trim() || undefined,
        comment: revComment,
      });
      setRevDone(true);
      setRevComment("");
      setRevTitle("");
      const revData = await getProductReviews(product.id).catch(() => []);
      setReviews(revData);
      if (revData.length > 0) {
        const avg =
          revData.reduce((acc, r) => acc + r.rating, 0) / revData.length;
        setProduct({ ...product, avg_rating: avg, review_count: revData.length });
      }
    } catch (e) {
      setRevError(
        errorDetailMessage(e, "No se pudo enviar la reseña. Intenta de nuevo.")
      );
    } finally {
      setRevBusy(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.screen, styles.center, { backgroundColor: C.bg }]}>
        <ActivityIndicator size="large" color={C.accent} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.screen, styles.center, { backgroundColor: C.bg }]}>
        <Text style={{ color: C.textSecondary }}>Producto no encontrado.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
          <Text style={{ color: C.accent, fontWeight: "700" }}>← Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const price = effectivePrice(product);
  const discount = discountPercent(product);
  const specs = specList(product.technical_spec);
  const images = product.images?.filter(Boolean) || [];
  const activeUri = images[activeImage] || null;

  const ratingBars = [5, 4, 3, 2, 1].map((star) => {
    const total = reviews.length || 1;
    const count = reviews.filter((r) => Math.round(r.rating) === star).length;
    return { star, count, pct: Math.round((count / total) * 100) };
  });
  const avg = product.avg_rating || 0;
  const isSoldByMe = false;

  return (
    <View style={[styles.screen, { backgroundColor: C.bg }]}>
      <UserTopBar
        back
        right={
          <TouchableOpacity onPress={handleFavorite} style={styles.heartBtn}>
            <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={22} color={isFavorite ? C.pink : "#9ca3af"} />
          </TouchableOpacity>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>
        {activeUri ? (
          <Image source={{ uri: activeUri }} style={[styles.hero, { width }]} resizeMode="cover" />
        ) : (
          <View style={[styles.hero, styles.heroFallback, { width, backgroundColor: C.bgSecondary }]}>
            <Ionicons name="bag" size={54} color={C.muted} />
          </View>
        )}

        {images.length > 1 ? (
          <View style={styles.thumbsRow}>
            {images.map((uri, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setActiveImage(i)}
                style={[
                  styles.thumb,
                  {
                    borderColor: i === activeImage ? C.emerald : C.border,
                    backgroundColor: C.bgCard,
                  },
                ]}
              >
                <Image source={{ uri }} style={styles.thumbImg} />
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        <View style={styles.body}>
          {product.company_name ? (
            <View style={styles.sellerRow}>
              <Text style={[styles.soldBy, { color: C.muted }]}>
                Vendido por <Text style={styles.soldByStrong}>{product.company_name}</Text>
              </Text>
              {!isSoldByMe ? (
                <View style={[styles.verifiedBadge, { backgroundColor: C.successBg }]}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                    <Ionicons name="checkmark-circle" size={13} color={C.emerald} />
                    <Text style={{ color: C.emerald, fontSize: 11, fontWeight: "800" }}>Verificado</Text>
                  </View>
                </View>
              ) : null}
            </View>
          ) : null}

          <Text style={[styles.name, { color: C.text }]}>{product.name}</Text>

          <View style={styles.ratingRow}>
            <Stars value={avg} size={15} />
            <Text style={[styles.ratingText, { color: C.muted }]}>
              {avg.toFixed(1)}
              {product.review_count > 0 ? ` (${product.review_count})` : ""}
            </Text>
          </View>

          {product.descripcion ? (
            <Text style={[styles.desc, { color: C.textSecondary }]}>
              {product.descripcion}
            </Text>
          ) : null}

          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: C.emerald }]}>{formatCOP(price)}</Text>
            {discount > 0 && (
              <>
                <Text style={[styles.oldPrice, { color: C.muted }]}>
                  {formatCOP(product.price)}
                </Text>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>-{discount}%</Text>
                </View>
              </>
            )}
          </View>

          <Text style={[styles.stock, { color: product.stock > 0 ? C.emerald : C.errorTextRed }]}>
            {product.stock > 0
              ? product.stock <= 5
                ? `¡Solo quedan ${product.stock} unidades!`
                : `Disponible (${product.stock} en stock)`
              : "Agotado"}
          </Text>
          <Text style={[styles.vat, { color: C.muted }]}>Precio con IVA incluido</Text>

          <View style={styles.trustRow}>
            {["Garantía incluida", "Envío rápido", "Soporte"].map((t) => (
              <View key={t} style={[styles.trustChip, { backgroundColor: C.bgSecondary, borderColor: C.border }]}>
                <Text style={[styles.trustText, { color: C.textSecondary }]}>{t}</Text>
              </View>
            ))}
          </View>

          {product.company_name ? (
            <View style={styles.storeBlock}>
              <Text style={[styles.blockTitle, { color: C.text }]}>
                Tienda que vende este producto
              </Text>
              <View style={styles.storeCard}>
                <LinearGradient
                  colors={[C.emerald, C.emeraldDark]}
                  style={styles.storeAvatar}
                >
                  <Text style={styles.storeInitial}>
                    {product.company_name.charAt(0).toUpperCase()}
                  </Text>
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.storeName, { color: C.text }]}>
                    {product.company_name}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                    <Ionicons name="shield-checkmark" size={14} color={C.emerald} />
                    <Text style={[styles.storeBadge, { color: C.emerald }]}>Tienda verificada</Text>
                  </View>
                </View>
              </View>
            </View>
          ) : null}

          {specs.length > 0 && (
            <View style={styles.storeBlock}>
              <Text style={[styles.blockTitle, { color: C.text }]}>
                Características y detalles
              </Text>
              <View style={[styles.specBox, { borderColor: C.border }]}>
                {specs.map((spec, index) => (
                  <View
                    key={index}
                    style={[styles.specRow, index < specs.length - 1 && { borderBottomColor: C.border, borderBottomWidth: 1 }]}
                  >
                    <Text style={[styles.specLabel, { color: C.muted }]}>{spec.label}</Text>
                    <Text style={[styles.specValue, { color: C.text }]}>{spec.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.storeBlock}>
            <Text style={[styles.blockTitle, { color: C.text }]}>
              Opiniones y Reseñas
            </Text>

            {reviews.length > 0 ? (
              <View style={[styles.reviewSummary, { borderColor: C.border }]}>
                <View style={styles.reviewSummaryLeft}>
                  <Text style={[styles.reviewBig, { color: C.text }]}>{avg.toFixed(1)}</Text>
                  <Stars value={avg} size={14} />
                  <Text style={[styles.reviewCount, { color: C.muted }]}>
                    {product.review_count} {product.review_count === 1 ? "reseña" : "reseñas"}
                  </Text>
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  {ratingBars.map((b) => (
                    <View key={b.star} style={styles.barRow}>
                      <View style={styles.barLabelWrap}>
                      <Text style={[styles.barLabel, { color: C.muted }]}>{b.star}</Text>
                      <Ionicons name="star" size={11} color={C.muted} />
                    </View>
                      <View style={[styles.barTrack, { backgroundColor: C.bgSecondary }]}>
                        <View
                          style={[
                            styles.barFill,
                            { width: `${b.pct}%`, backgroundColor: C.emerald },
                          ]}
                        />
                      </View>
                      <Text style={[styles.barCount, { color: C.muted }]}>{b.count}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <Text style={[styles.noReviews, { color: C.muted }]}>
                Este producto aún no tiene reseñas.
              </Text>
            )}

            {isAuthenticated ? (
              <View style={[styles.reviewForm, { backgroundColor: C.bgSecondary, borderColor: C.border }]}>
                <Text style={[styles.reviewFormTitle, { color: C.text }]}>
                  ¿Compraste este producto? Comparte tu opinión
                </Text>
                <View style={styles.reviewStars}>
                  <StarRatingEditable value={revRating} onChange={setRevRating} size={28} />
                </View>
                <TextInput
                  value={revTitle}
                  onChangeText={setRevTitle}
                  placeholder="Título (opcional)"
                  placeholderTextColor={C.textSecondary}
                  style={[styles.reviewInput, { backgroundColor: C.bgCard, borderColor: C.inputBorder, color: C.text }]}
                />
                <TextInput
                  value={revComment}
                  onChangeText={setRevComment}
                  placeholder="Escribe tu reseña..."
                  placeholderTextColor={C.textSecondary}
                  multiline
                  style={[styles.reviewInput, styles.reviewTextarea, { backgroundColor: C.bgCard, borderColor: C.inputBorder, color: C.text }]}
                />
                {revError ? <Text style={[styles.revError, { color: C.errorTextRed }]}>{revError}</Text> : null}
                {revDone ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Ionicons name="checkmark-circle" size={15} color={C.successTextGreen} />
                    <Text style={[styles.revDone, { color: C.successTextGreen }]}>
                      Tu reseña fue publicada
                    </Text>
                  </View>
                ) : null}
                <TouchableOpacity
                  style={[styles.submitReviewBtn, { backgroundColor: C.emerald, opacity: revBusy ? 0.6 : 1 }]}
                  onPress={submitReview}
                  disabled={revBusy}
                >
                  <Text style={styles.submitReviewText}>
                    {revBusy ? "Enviando..." : "Publicar reseña"}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.loginToReview, { borderColor: C.emerald }]}
                onPress={() => navigation.navigate("Login")}
              >
                <Text style={[styles.loginToReviewText, { color: C.emerald }]}>
                  Inicia sesión para reseñar este producto
                </Text>
              </TouchableOpacity>
            )}

            {reviews.map((review) => (
              <View key={review.id} style={[styles.review, { backgroundColor: C.bgSecondary, borderColor: C.border }]}>
                <View style={styles.reviewHeader}>
                  <View style={[styles.reviewAvatar, { backgroundColor: C.emerald }]}>
                    <Text style={styles.reviewAvatarText}>
                      {review.user_name?.charAt(0)?.toUpperCase() || "?"}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.reviewUser, { color: C.text }]}>{review.user_name}</Text>
                    <Text style={[styles.reviewMeta, { color: C.muted }]}>
                      {formatDate(review.created_at)}
                    </Text>
                  </View>
                  <Stars value={review.rating} size={12} />
                </View>
                {review.title ? (
                  <Text style={[styles.reviewTitle, { color: C.text }]}>{review.title}</Text>
                ) : null}
                <Text style={[styles.reviewCommentColor, { color: C.textSecondary }]}>{review.comment}</Text>
              </View>
            ))}
          </View>

          {related.length > 0 ? (
            <View style={styles.storeBlock}>
              <Text style={[styles.blockTitle, { color: C.text }]}>Quizás te guste</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                {related.map((item) => (
                  <View key={item.id} style={{ width: 190 }}>
                    <ProductCard product={item} variant="home" />
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: C.bgCard, borderTopColor: C.border }]}>
        <View style={styles.qtySelector}>
          <TouchableOpacity
            style={[styles.qtyBtn, { backgroundColor: C.bgSecondary, borderColor: C.border }]}
            onPress={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            <Text style={{ color: C.text, fontWeight: "700" }}>−</Text>
          </TouchableOpacity>
          <Text style={[styles.qtyText, { color: C.text }]}>{quantity}</Text>
          <TouchableOpacity
            style={[styles.qtyBtn, { backgroundColor: C.bgSecondary, borderColor: C.border }]}
            onPress={() => setQuantity((q) => Math.min(Math.max(product.stock, 1), q + 1))}
          >
            <Text style={{ color: C.text, fontWeight: "700" }}>+</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: C.emerald, opacity: product.stock <= 0 || adding ? 0.5 : 1 }]}
          onPress={handleAdd}
          disabled={product.stock <= 0 || adding}
        >
          <Text style={styles.addText}>
            {adding ? "Agregando..." : "Agregar al carrito"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, { borderColor: isFavorite ? C.pink : C.border }]}
          onPress={handleFavorite}
        >
          <Ionicons
            name={isFavorite ? "heart" : "heart-outline"}
            size={16}
            color={isFavorite ? C.pink : C.text}
          />
          <Text style={[styles.saveText, { color: isFavorite ? C.pink : C.text }]}>
            {isFavorite ? "Guardado" : "Guardar"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  heartBtn: { padding: 6 },
  heartIcon: { fontSize: 24, fontWeight: "700" },
  hero: { height: 320 },
  heroFallback: { alignItems: "center", justifyContent: "center" },
  thumbsRow: { flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingTop: 10 },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 10,
    borderWidth: 2,
    overflow: "hidden",
  },
  thumbImg: { width: 60, height: 60, borderRadius: 8 },
  body: { padding: 16 },
  sellerRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  soldBy: { fontSize: 13 },
  soldByStrong: { fontWeight: "700", color: "#6b7280" },
  verifiedBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  name: { fontSize: 20, fontWeight: "800", lineHeight: 26 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  ratingText: { fontSize: 13 },
  desc: { fontSize: 14, lineHeight: 21, marginTop: 10 },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 16 },
  price: { fontSize: 28, fontWeight: "900" },
  oldPrice: { fontSize: 16, textDecorationLine: "line-through" },
  discountBadge: {
    backgroundColor: "#facc15",
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  discountText: { color: "#111827", fontSize: 12, fontWeight: "800" },
  stock: { marginTop: 10, fontSize: 13, fontWeight: "700" },
  vat: { fontSize: 11, marginTop: 2 },
  trustRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 },
  trustChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  trustText: { fontSize: 11, fontWeight: "600" },
  storeBlock: { marginTop: 26 },
  blockTitle: { fontSize: 17, fontWeight: "800", marginBottom: 12 },
  storeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#f9fafb",
  },
  storeAvatar: {
    width: 46,
    height: 46,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  storeInitial: { color: "#fff", fontSize: 20, fontWeight: "800" },
  storeName: { fontSize: 15, fontWeight: "700" },
  storeBadge: { fontSize: 12, fontWeight: "700", marginTop: 2 },
  specBox: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14 },
  specRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  specLabel: { fontSize: 13, flexShrink: 1 },
  specValue: { fontSize: 13, fontWeight: "700", flexShrink: 1, textAlign: "right" },
  reviewSummary: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  reviewSummaryLeft: { alignItems: "center", gap: 4, minWidth: 78 },
  reviewBig: { fontSize: 34, fontWeight: "900" },
  reviewCount: { fontSize: 11 },
  barRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  barLabelWrap: { flexDirection: "row", alignItems: "center", gap: 2, width: 22 },
  barLabel: { fontSize: 12 },
  barTrack: { flex: 1, height: 8, borderRadius: 999, overflow: "hidden" },
  barFill: { height: 8, borderRadius: 999 },
  barCount: { fontSize: 12, width: 20, textAlign: "right" },
  noReviews: { fontSize: 13, marginBottom: 14 },
  reviewForm: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 18,
  },
  reviewFormTitle: { fontSize: 14, fontWeight: "800", marginBottom: 8 },
  reviewStars: { marginBottom: 12 },
  reviewInput: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 10,
  },
  reviewTextarea: { minHeight: 80, textAlignVertical: "top" },
  revError: { fontSize: 12, fontWeight: "600", marginBottom: 8 },
  revDone: { fontSize: 12, fontWeight: "800", marginBottom: 8 },
  submitReviewBtn: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  submitReviewText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  loginToReview: {
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 18,
  },
  loginToReviewText: { fontSize: 13, fontWeight: "800" },
  review: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  reviewHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  reviewAvatar: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewAvatarText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  reviewUser: { fontSize: 13, fontWeight: "700" },
  reviewMeta: { fontSize: 11, marginTop: 1 },
  reviewTitle: { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  reviewCommentColor: { fontSize: 13, lineHeight: 19 },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderTopWidth: 1,
  },
  qtySelector: { flexDirection: "row", alignItems: "center", gap: 6 },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: { fontSize: 15, fontWeight: "800", minWidth: 20, textAlign: "center" },
  addBtn: {
    flex: 1,
    borderRadius: 11,
    paddingVertical: 14,
    alignItems: "center",
  },
  addText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 11,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  saveText: { fontSize: 12, fontWeight: "700" },
});