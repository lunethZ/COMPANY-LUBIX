import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { useNavigation, type CompositeNavigationProp } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { ProductCard } from "../components/ProductCard";
import { UserTopBar } from "../components/UserTopBar";
import { searchProducts, getCatalogs } from "../api/products";
import { getFavorites, toggleFavorite } from "../api/user";
import { categoryIcon, type CategoryGlyph } from "../utils/category";
import type { Product } from "../types/product";
import type { Category } from "../types/product";
import type { MainTabParamList, RootStackParamList } from "../navigation/types";

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, "Inicio">,
  NativeStackNavigationProp<RootStackParamList>
>;

const BANNERS: Array<{ tag: string; title: string; subtitle: string; icon: CategoryGlyph }> = [
  {
    tag: "OFERTA ESPECIAL",
    title: "Hasta 40% de descuento",
    subtitle: "En productos seleccionados de la tienda.",
    icon: "pricetag",
  },
  {
    tag: "TECNOLOGÍA",
    title: "Los últimos lanzamientos",
    subtitle: "Descubre lo nuevo en gadgets y accesorios.",
    icon: "hardware-chip",
  },
  {
    tag: "ENVÍO RÁPIDO",
    title: "Recibe en tu puerta",
    subtitle: "Compra seguro con garantía incluida.",
    icon: "cube",
  },
];

export default function HomeUsuarioScreen() {
  const navigation = useNavigation<Nav>();
  const { C } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const { width: winW } = useWindowDimensions();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [query, setQuery] = useState("");

  const cardWidth = (winW - 16 * 2 - 12) / 2;

  const loadFavorites = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const favs = await getFavorites();
      setFavoriteIds(new Set(favs.map((f) => f.product.id)));
    } catch {
      // sin favoritos
    }
  }, [isAuthenticated]);

  const load = useCallback(async () => {
    try {
      const [cats, all, withDiscount] = await Promise.all([
        getCatalogs(),
        searchProducts({}),
        searchProducts({ orden: "discount" }),
      ]);
      setCategories(cats);
      setProducts(all);
      const offers = withDiscount.filter((p) => p.discount_enable);
      setFeatured((offers.length > 0 ? offers : all).slice(0, 6));
    } catch {
      // backend unavailable
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([load(), loadFavorites()]);
      setLoading(false);
    })();
  }, [load, loadFavorites]);

  useEffect(() => {
    const t = setInterval(
      () => setBannerIndex((i) => (i + 1) % BANNERS.length),
      3500
    );
    return () => clearInterval(t);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([load(), loadFavorites()]);
    setRefreshing(false);
  };

  const handleToggleFavorite = async (p: Product) => {
    if (!onToggleFavoriteGuard()) return;
    try {
      const r = await toggleFavorite(p.id);
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (r.is_favorite) next.add(p.id);
        else next.delete(p.id);
        return next;
      });
    } catch {
      // error silencioso
    }
  };

  const onToggleFavoriteGuard = () => {
    if (!isAuthenticated) {
      navigation.navigate("Login");
      return false;
    }
    return true;
  };

  const firstName = user?.name?.split(" ")[0] || "";
  const banner = BANNERS[bannerIndex];

  return (
    <View style={[styles.screen, { backgroundColor: C.bg }]}>
      <UserTopBar
        searchValue={query}
        onChangeSearch={setQuery}
        onSubmitSearch={(q) => navigation.navigate("Buscar", { q })}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.accent} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.hero}>
            <Text style={[styles.eyebrow, { color: C.accent }]}>INICIO</Text>
            <Text style={[styles.welcome, { color: C.text }]}>
              {firstName ? `Bienvenido de nuevo, ${firstName}` : "Bienvenido de nuevo a Lubix"}
            </Text>
            <Text style={[styles.sub, { color: C.muted }]}>
              Descubre los mejores productos y descuentos exclusivos.
            </Text>
          </View>

          <LinearGradient
            colors={[C.emerald, C.emeraldDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.banner, { width: winW - 32 }]}
          >
            <View style={styles.bannerTop}>
              <View style={styles.bannerTextWrap}>
                <Text style={styles.bannerTag}>{banner.tag}</Text>
                <Text style={styles.bannerTitle}>{banner.title}</Text>
                <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
              </View>
              <Ionicons name={banner.icon} size={42} color="#ffffff" />
            </View>
            <View style={styles.bannerFooterRow}>
              <TouchableOpacity
                style={styles.bannerBtn}
                onPress={() => navigation.navigate("Buscar")}
              >
                <Text style={styles.bannerBtnText}>Ver productos →</Text>
              </TouchableOpacity>
              <View style={styles.dots}>
                {BANNERS.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      i === bannerIndex && styles.dotActive,
                    ]}
                  />
                ))}
              </View>
            </View>
          </LinearGradient>

          {categories.length > 0 ? (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: C.text }]}>
                Categorías Principales
              </Text>
              <Text style={[styles.sectionSub, { color: C.muted }]}>
                Explora por categoría
              </Text>
              <View style={styles.grid}>
                {categories.slice(0, 6).map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.catCard,
                      { width: cardWidth, backgroundColor: C.bgCard, borderColor: C.border },
                    ]}
                    onPress={() => navigation.navigate("Buscar", { categoria: cat.name })}
                  >
                    <Ionicons name={categoryIcon(cat.name)} size={26} color={C.emerald} />
                    <Text style={[styles.catName, { color: C.text }]} numberOfLines={2}>
                      {cat.name}
                    </Text>
                    <Text style={[styles.catCount, { color: C.muted }]}>
                      {cat.product_count}{" "}
                      {cat.product_count === 1 ? "producto" : "productos"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: C.emerald }]}>
              Productos Destacados
            </Text>
            {products.length === 0 ? (
              <View
                style={[
                  styles.empty,
                  { backgroundColor: C.bgSecondary, borderColor: C.border },
                ]}
              >
                <Ionicons name="cube-outline" size={44} color={C.muted} />
                <Text style={[styles.emptyTitle, { color: C.text }]}>
                  No hay productos disponibles
                </Text>
                <Text style={[styles.emptySub, { color: C.muted }]}>
                  Aún no se han agregado productos a la tienda.
                </Text>
              </View>
            ) : (
              <View style={styles.grid}>
                {featured.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    variant="home"
                    width={cardWidth}
                    favoriteIds={favoriteIds}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  hero: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12 },
  eyebrow: { fontSize: 12, fontWeight: "800", letterSpacing: 1, marginBottom: 8 },
  welcome: { fontSize: 25, fontWeight: "800", lineHeight: 32 },
  sub: { fontSize: 13, marginTop: 6 },
  banner: {
    marginLeft: 16,
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 5,
  },
  bannerTop: { flexDirection: "row", alignItems: "flex-start" },
  bannerTextWrap: { flex: 1, paddingRight: 12 },
  bannerTag: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    opacity: 0.9,
  },
  bannerTitle: { color: "#ffffff", fontSize: 22, fontWeight: "800", marginTop: 6 },
  bannerSubtitle: { color: "#ffffff", fontSize: 13, marginTop: 4, opacity: 0.9 },
  bannerEmoji: { fontSize: 44, marginTop: 4 },
  bannerFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
  },
  bannerBtn: {
    backgroundColor: "#ffffff",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  bannerBtnText: { color: "#047857", fontSize: 13, fontWeight: "800" },
  dots: { flexDirection: "row", gap: 6 },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  dotActive: { backgroundColor: "#ffffff", width: 18 },
  section: { marginTop: 28, paddingHorizontal: 16 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  sectionSub: { fontSize: 13, textAlign: "center", marginTop: 4, marginBottom: 18 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignSelf: "center",
    width: "100%",
  },
  catCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  catEmoji: { fontSize: 28, marginBottom: 8 },
  catName: { fontSize: 13, fontWeight: "700", textAlign: "center" },
  catCount: { fontSize: 11, marginTop: 4 },
  empty: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 32,
    alignItems: "center",
    marginTop: 8,
  },
  emptyEmoji: { fontSize: 40, marginBottom: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "800" },
  emptySub: { fontSize: 13, marginTop: 4, textAlign: "center" },
});