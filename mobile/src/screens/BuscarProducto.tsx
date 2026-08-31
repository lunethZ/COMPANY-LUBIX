import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { CompositeNavigationProp } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ProductCard } from "../components/ProductCard";
import { UserTopBar } from "../components/UserTopBar";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { searchProducts, getCatalogs } from "../api/products";
import { getFavorites, toggleFavorite } from "../api/user";
import { categoryIcon } from "../utils/category";
import type { Product } from "../types/product";
import type { Category } from "../types/product";
import type { MainTabParamList, RootStackParamList } from "../navigation/types";

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, "Buscar">,
  NativeStackNavigationProp<RootStackParamList>
>;
type Route = RouteProp<MainTabParamList, "Buscar">;

type OrderKey = "" | "price_asc" | "price_desc" | "discount";

const ORDER_OPTIONS: Array<{ key: OrderKey; label: string }> = [
  { key: "", label: "Relevancia" },
  { key: "price_asc", label: "Menor precio" },
  { key: "price_desc", label: "Mayor precio" },
  { key: "discount", label: "Ofertas" },
];

export default function BuscarProductoScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { C } = useTheme();
  const { isAuthenticated } = useAuth();
  const { width: winW } = useWindowDimensions();

  const [query, setQuery] = useState(route.params?.q || "");
  const [applied, setApplied] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    route.params?.categoria || null
  );
  const [order, setOrder] = useState<OrderKey>("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  const cardWidth = (winW - 16 * 2 - 12) / 2;

  useEffect(() => {
    getCatalogs().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    getFavorites()
      .then((f) => setFavoriteIds(new Set(f.map((x) => x.product.id))))
      .catch(() => {});
  }, [isAuthenticated]);

  const runSearch = useCallback(
    async (
      q: string,
      category: string | null,
      ord: OrderKey,
      min?: string,
      max?: string
    ) => {
      setLoading(true);
      try {
        const data = await searchProducts({
          q: q.trim() || undefined,
          categoria: category || undefined,
          orden: ord || undefined,
          min: min && !isNaN(Number(min)) ? Number(min) : undefined,
          max: max && !isNaN(Number(max)) ? Number(max) : undefined,
        });
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const apply = useCallback(
    (extra?: { q?: string; category?: string | null }) => {
      const q = extra?.q !== undefined ? extra.q : query;
      const cat =
        extra?.category !== undefined ? extra.category : selectedCategory;
      setApplied(true);
      runSearch(q, cat, order, priceMin, priceMax);
    },
    [query, selectedCategory, order, priceMin, priceMax, runSearch]
  );

  useEffect(() => {
    const q = route.params?.q;
    const cat = route.params?.categoria;
    if (q !== undefined || cat !== undefined) {
      setQuery(q ?? "");
      setSelectedCategory(cat ?? null);
      setApplied(true);
      runSearch(q ?? "", cat ?? null, order, priceMin, priceMax);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params?.q, route.params?.categoria]);

  const selectCategory = (name: string) => {
    const next = selectedCategory === name ? null : name;
    setSelectedCategory(next);
    apply({ category: next });
  };

  const selectOrder = (ord: OrderKey) => {
    const next = order === ord ? "" : ord;
    setOrder(next);
    setApplied(true);
    runSearch(query, selectedCategory, next, priceMin, priceMax);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setQuery("");
    setSelectedCategory(null);
    setOrder("");
    setPriceMin("");
    setPriceMax("");
    setApplied(false);
    setResults([]);
  };

  const handleToggleFavorite = async (p: Product) => {
    if (!isAuthenticated) {
      navigation.navigate("Login");
      return;
    }
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

  const onRefresh = async () => {
    setRefreshing(true);
    if (applied) {
      await runSearch(query, selectedCategory, order, priceMin, priceMax);
    }
    setRefreshing(false);
  };

  return (
    <View style={[styles.screen, { backgroundColor: C.bg }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <UserTopBar
          searchValue={query}
          onChangeSearch={(v) => {
            setQuery(v);
          }}
          onSubmitSearch={() => apply()}
        />

        <View style={[styles.controlsWrap, { borderBottomColor: C.border }]}>
          <View style={styles.controlsRow}>
            <Text style={[styles.resultCount, { color: C.text }]}>
              {applied
                ? `${results.length} ${results.length === 1 ? "resultado" : "resultados"}`
                : "Busca un producto"}
            </Text>
            <TouchableOpacity
              onPress={() => setShowFilters((s) => !s)}
              style={[
                styles.filtersBtn,
                { backgroundColor: showFilters ? C.emerald : C.bgCard, borderColor: showFilters ? C.emerald : C.border },
              ]}
            >
              <Text
                style={[styles.filtersBtnText, { color: showFilters ? "#fff" : C.text }]}
              >
                {showFilters ? "Ocultar filtros ▲" : "Mostrar filtros ▼"}
              </Text>
            </TouchableOpacity>
          </View>

          {showFilters ? (
            <View style={[styles.filtersBox, { backgroundColor: C.bgSecondary, borderColor: C.border }]}>
              <Text style={[styles.filtersLabel, { color: C.text }]}>Categorías</Text>
              <View style={styles.chipsWrap}>
                {categories.map((cat) => {
                  const active = selectedCategory === cat.name;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => selectCategory(cat.name)}
                      style={[
                        styles.chip,
                        { backgroundColor: active ? C.emerald : C.bgCard, borderColor: active ? C.emerald : C.border },
                      ]}
                    >
                      <Ionicons name={categoryIcon(cat.name)} size={15} color={active ? "#fff" : C.textSecondary} />
                      <Text style={[styles.chipText, { color: active ? "#fff" : C.text }]}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.filtersLabel, { color: C.text }]}>Precio</Text>
              <View style={styles.priceRow}>
                <View style={[styles.priceInputWrap, { borderColor: C.inputBorder, backgroundColor: C.bgCard }]}>
                  <TextInput
                    value={priceMin}
                    onChangeText={setPriceMin}
                    placeholder="Mínimo"
                    placeholderTextColor={C.textSecondary}
                    keyboardType="numeric"
                    style={[styles.priceInput, { color: C.text }]}
                  />
                </View>
                <Text style={[styles.priceSep, { color: C.muted }]}>—</Text>
                <View style={[styles.priceInputWrap, { borderColor: C.inputBorder, backgroundColor: C.bgCard }]}>
                  <TextInput
                    value={priceMax}
                    onChangeText={setPriceMax}
                    placeholder="Máximo"
                    placeholderTextColor={C.textSecondary}
                    keyboardType="numeric"
                    style={[styles.priceInput, { color: C.text }]}
                  />
                </View>
              </View>

              <View style={styles.filterActions}>
                <TouchableOpacity
                  onPress={() => apply()}
                  style={[styles.applyBtn, { backgroundColor: C.emerald }]}
                >
                  <Text style={styles.applyBtnText}>Aplicar filtros</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={clearFilters}
                  style={[styles.clearBtn, { borderColor: C.border }]}
                >
                  <Text style={[styles.clearBtnText, { color: C.text }]}>Limpiar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.sortRow}>
              {ORDER_OPTIONS.map((opt) => {
                const active = order === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => selectOrder(opt.key)}
                    style={[
                      styles.sortChip,
                      { backgroundColor: active ? C.emerald : C.bgCard, borderColor: active ? C.emerald : C.border },
                    ]}
                  >
                    <Text style={[styles.sortChipText, { color: active ? "#fff" : C.text }]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={C.accent} />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 16, paddingHorizontal: 16, paddingBottom: 24 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            {!applied ? (
              <View style={styles.center}>
                <Ionicons name="search-outline" size={40} color={C.muted} />
                <Text style={[styles.emptyTitle, { color: C.text }]}>
                  Busca un producto
                </Text>
                <Text style={[styles.emptySub, { color: C.muted }]}>
                  Escribe una palabra clave o selecciona una categoría.
                </Text>
              </View>
            ) : results.length === 0 ? (
              <View style={styles.center}>
                <Ionicons name="sad-outline" size={40} color={C.muted} />
                <Text style={[styles.emptyTitle, { color: C.text }]}>
                  Sin resultados
                </Text>
                <Text style={[styles.emptySub, { color: C.muted }]}>
                  No encontramos productos. Prueba con otra búsqueda o limpia los
                  filtros.
                </Text>
                <TouchableOpacity
                  onPress={clearFilters}
                  style={[styles.applyBtn, { backgroundColor: C.emerald, marginTop: 16 }]}
                >
                  <Text style={styles.applyBtnText}>Limpiar búsqueda</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.grid}>
                {results.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    variant="search"
                    width={cardWidth}
                    favoriteIds={favoriteIds}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </View>
            )}
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  controlsWrap: { borderBottomWidth: 1, paddingHorizontal: 16, paddingBottom: 10 },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  resultCount: { fontSize: 14, fontWeight: "700" },
  filtersBtn: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  filtersBtnText: { fontSize: 12, fontWeight: "700" },
  filtersBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  filtersLabel: { fontSize: 13, fontWeight: "800", marginBottom: 8, marginTop: 4 },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipText: { fontSize: 13, fontWeight: "600" },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  priceInputWrap: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  priceInput: { fontSize: 14, paddingVertical: 9 },
  priceSep: { fontSize: 14 },
  filterActions: { flexDirection: "row", gap: 10, marginTop: 12 },
  applyBtn: { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  applyBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  clearBtn: { borderRadius: 10, borderWidth: 1, paddingVertical: 12, paddingHorizontal: 18 },
  clearBtnText: { fontSize: 14, fontWeight: "700" },
  sortRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  sortChip: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7 },
  sortChipText: { fontSize: 12, fontWeight: "700" },
  center: { paddingVertical: 60, alignItems: "center", justifyContent: "center" },
  emptyEmoji: { fontSize: 44, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: "800" },
  emptySub: { fontSize: 13, marginTop: 6, textAlign: "center", paddingHorizontal: 24 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
});