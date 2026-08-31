import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  useWindowDimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useTheme } from "../context/ThemeContext";
import { UserTopBar } from "../components/UserTopBar";
import { getCatalogs } from "../api/products";
import { categoryIcon } from "../utils/category";
import type { Category } from "../types/product";
import type { MainTabParamList } from "../navigation/types";

type Nav = BottomTabNavigationProp<MainTabParamList, "Categorias">;

export default function CategoriasScreen() {
  const navigation = useNavigation<Nav>();
  const { C } = useTheme();
  const { width: winW } = useWindowDimensions();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cardWidth = (winW - 16 * 2 - 12) / 2;

  const load = async () => {
    try {
      const cats = await getCatalogs();
      setCategories(cats);
    } catch {
      // backend unavailable
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <View style={[styles.screen, { backgroundColor: C.bg }]}>
      <UserTopBar />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.accent} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <Text style={[styles.title, { color: C.text }]}>Categorías Principales</Text>
          <Text style={[styles.sub, { color: C.muted }]}>
            Explora todo lo que tenemos para ti
          </Text>

          {categories.length === 0 ? (
            <View style={[styles.empty, { backgroundColor: C.bgSecondary, borderColor: C.border }]}>
              <Ionicons name="grid-outline" size={40} color={C.muted} />
              <Text style={[styles.emptyTitle, { color: C.text }]}>
                No hay categorías disponibles
              </Text>
              <Text style={[styles.emptySub, { color: C.muted }]}>
                Cuando el administrador cree categorías aparecerán aquí.
              </Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.card,
                    { width: cardWidth, backgroundColor: C.bgCard, borderColor: C.border, shadowColor: C.shadow },
                  ]}
                  onPress={() => navigation.navigate("Buscar", { categoria: cat.name })}
                >
                  <Ionicons name={categoryIcon(cat.name)} size={30} color={C.accent} />
                  <Text style={[styles.name, { color: C.text }]} numberOfLines={2}>
                    {cat.name}
                  </Text>
                  <Text style={[styles.count, { color: C.muted }]}>
                    {cat.product_count} {cat.product_count === 1 ? "producto" : "productos"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  title: { fontSize: 24, fontWeight: "800", textAlign: "center" },
  sub: { fontSize: 13, textAlign: "center", marginTop: 6, marginBottom: 20 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 12,
    alignItems: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  emoji: { fontSize: 36 },
  name: { fontSize: 14, fontWeight: "700", marginTop: 8, textAlign: "center" },
  count: { fontSize: 12, marginTop: 3 },
  empty: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 32,
    alignItems: "center",
  },
  emptyEmoji: { fontSize: 40, marginBottom: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "800" },
  emptySub: { fontSize: 13, marginTop: 4, textAlign: "center" },
});