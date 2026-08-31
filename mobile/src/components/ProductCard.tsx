import { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  TouchableOpacity,
} from "react-native";
import {
  CompositeNavigationProp,
  useNavigation,
} from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../context/ThemeContext";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { toggleFavorite } from "../api/user";
import { MainTabParamList, RootStackParamList } from "../navigation/types";
import { Product } from "../types/product";
import { formatCOP } from "../utils/format";
import { Stars } from "./ui";
import { discountPercent, effectivePrice } from "../types/product";

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

interface Props {
  product: Product;
  variant?: "home" | "search";
  width?: number;
  favoriteIds?: Set<string>;
  onToggleFavorite?: (p: Product) => void;
}

export function ProductCard({
  product,
  variant = "home",
  width,
  favoriteIds,
  onToggleFavorite,
}: Props) {
  const { C } = useTheme();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigation = useNavigation<Nav>();
  const [added, setAdded] = useState(false);

  const price = effectivePrice(product);
  const discount = discountPercent(product);
  const out = product.stock <= 0;
  const isFav =
    favoriteIds !== undefined ? favoriteIds.has(product.id) : false;

  const image = product.images && product.images.length > 0 ? product.images[0] : null;

  const goDetail = () => navigation.navigate("ProductoDetalle", { id: product.id });

  const handleFav = () => {
    if (!isAuthenticated) {
      navigation.navigate("Login");
      return;
    }
    if (onToggleFavorite) {
      onToggleFavorite(product);
    } else {
      toggleFavorite(product.id).catch(() => {});
    }
  };

  const handleAdd = async () => {
    if (out || added) return;
    try {
      await addToCart(product, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    } catch {
      // ignore, carrito maneja errores
    }
  };

  return (
    <Pressable
      onPress={goDetail}
      style={[
        styles.card,
        {
          width,
          backgroundColor: C.bgCard,
          borderColor: C.border,
          shadowColor: C.shadow,
        },
      ]}
    >
      <View style={styles.imageWrap}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.placeholder, { backgroundColor: C.bgSecondary }]}>
            <Ionicons name="bag" size={40} color={C.muted} />
          </View>
        )}

        {discount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>-{discount}%</Text>
          </View>
        )}

        <TouchableOpacity style={styles.favBtn} onPress={handleFav}>
          <Ionicons
            name={isFav ? "heart" : "heart-outline"}
            size={18}
            color={isFav ? C.pink : "#6b7280"}
          />
        </TouchableOpacity>

        {out && (
          <View style={styles.outOverlay}>
            <Text style={styles.outText}>Agotado</Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        {variant === "search" ? (
          <Text style={[styles.store, { color: C.muted }]}>{product.company_name}</Text>
        ) : null}

        {variant === "home" ? (
          <View style={styles.ratingRow}>
            <Stars value={product.avg_rating || 0} size={12} />
            <Text style={[styles.ratingSmall, { color: C.textSecondary }]}>
              {(product.avg_rating || 0).toFixed(1)}
              {product.review_count > 0 ? ` (${product.review_count})` : ""}
            </Text>
          </View>
        ) : null}

        <Text numberOfLines={2} style={[styles.name, { color: C.text }]}>
          {product.name}
        </Text>

        {variant === "search" ? (
          <Text
            numberOfLines={2}
            style={[styles.desc, { color: C.muted }]}
          >
            {product.descripcion}
          </Text>
        ) : (
          <Text numberOfLines={1} style={[styles.desc, { color: C.muted }]}>
            {product.descripcion}
          </Text>
        )}

        {variant === "home" ? (
          <Text style={[styles.soldBy, { color: C.textSecondary }]}>
            Vendido por: <Text style={styles.soldByStrong}>{product.company_name || "Lubix"}</Text>
          </Text>
        ) : null}

        <View style={styles.priceRow}>
          <Text style={[styles.price, { color: variant === "home" ? C.emerald : C.accent }]}>
            {formatCOP(price)}
          </Text>
          {discount > 0 && (
            <Text style={[styles.oldPrice, { color: C.muted }]}>
              {formatCOP(product.price)}
            </Text>
          )}
        </View>

        {variant === "search" ? (
          <Text style={[styles.stockLine, { color: C.muted }]}>
            {out ? "Stock: Agotado" : `Stock: ${product.stock}`}
          </Text>
        ) : null}
      </View>

      {variant === "home" ? (
        <View style={styles.actions}>
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={out || added}
            onPress={handleAdd}
            style={[
              styles.addBtn,
              {
                backgroundColor: C.emerald,
                opacity: out || added ? 0.6 : 1,
              },
            ]}
          >
            {added ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                <Ionicons name="checkmark-circle" size={16} color="#fff" />
                <Text style={styles.addText}>Agregado</Text>
              </View>
            ) : (
              <Text style={styles.addText}>Agregar al carrito</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={goDetail}
            style={[styles.detailBtn, { borderColor: C.emerald }]}
          >
            <Text style={[styles.detailText, { color: C.emerald }]}>Ver detalle</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 14,
  },
  imageWrap: {
    position: "relative",
  },
  image: {
    width: "100%",
    height: 170,
    backgroundColor: "#f3f4f6",
  },
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderEmoji: {
    fontSize: 44,
    opacity: 0.6,
  },
  badge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#facc15",
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  badgeText: {
    color: "#111827",
    fontSize: 11,
    fontWeight: "800",
  },
  favBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.85)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  favIcon: {
    fontSize: 18,
    fontWeight: "700",
  },
  outOverlay: {
    position: "absolute",
    inset: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  outText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "800",
  },
  body: {
    padding: 12,
  },
  store: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 4,
  },
  ratingSmall: {
    fontSize: 11,
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
    lineHeight: 19,
  },
  desc: {
    fontSize: 12,
    marginBottom: 6,
    color: "#6b7280",
  },
  soldBy: {
    fontSize: 11,
    marginBottom: 8,
    color: "#9ca3af",
  },
  soldByStrong: {
    fontWeight: "700",
    color: "#6b7280",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  price: {
    fontSize: 17,
    fontWeight: "800",
  },
  oldPrice: {
    fontSize: 12,
    textDecorationLine: "line-through",
  },
  stockLine: {
    fontSize: 11,
    marginTop: 6,
  },
  actions: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
  },
  addBtn: {
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
  },
  addText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  detailBtn: {
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 11,
    alignItems: "center",
  },
  detailText: {
    fontSize: 14,
    fontWeight: "700",
  },
});