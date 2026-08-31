import { ReactNode } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from "react-native";
import {
  CompositeNavigationProp,
  useNavigation,
} from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../context/ThemeContext";
import Ionicons from "@expo/vector-icons/Ionicons";
import { MainTabParamList, RootStackParamList } from "../navigation/types";

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

interface Props {
  back?: boolean;
  onBack?: () => void;
  showSearch?: boolean;
  searchValue?: string;
  onChangeSearch?: (v: string) => void;
  onSubmitSearch?: (q: string) => void;
  right?: ReactNode;
}

export function UserTopBar({
  back,
  onBack,
  showSearch = true,
  searchValue = "",
  onChangeSearch,
  onSubmitSearch,
  right,
}: Props) {
  const { C } = useTheme();
  const navigation = useNavigation<Nav>();

  const submit = (q: string) => {
    const value = q.trim();
    if (onSubmitSearch) {
      onSubmitSearch(value);
    } else if (value) {
      navigation.navigate("Buscar", { q: value });
    } else {
      navigation.navigate("Buscar");
    }
  };

  return (
    <View style={[styles.bar, { backgroundColor: C.navy }]}>
      {back ? (
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack ?? (() => navigation.goBack())}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={() => navigation.navigate("Main", { screen: "Inicio" })}
        >
          <Text style={styles.logo}>Lubix</Text>
        </TouchableOpacity>
      )}

      {showSearch ? (
        <View style={[styles.searchWrap, { backgroundColor: C.navyInput }]}>
          <Ionicons name="search" size={15} color="#9ca3af" style={styles.searchIcon} />
          {onSubmitSearch ? (
            <TextInput
              value={searchValue}
              onChangeText={onChangeSearch}
              onSubmitEditing={() => submit(searchValue)}
              returnKeyType="search"
              placeholder="Buscar productos..."
              placeholderTextColor="#9ca3af"
              style={styles.searchInput}
            />
          ) : (
            <Pressable style={styles.searchInput} onPress={() => navigation.navigate("Buscar")}>
              <Text style={styles.searchPlaceholder}>Buscar productos...</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <View style={styles.searchWrapSpacer} />
      )}

      {right ? <View style={styles.right}>{right}</View> : <View style={styles.rightSpacer} />}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 46,
    paddingBottom: 10,
    gap: 10,
  },
  logo: {
    color: "#22c55e",
    fontSize: 22,
    fontWeight: "800",
  },
  backBtn: {
    paddingRight: 4,
    paddingVertical: 2,
  },
  searchWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    paddingHorizontal: 12,
    minHeight: 38,
    overflow: "hidden",
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 6,
    opacity: 0.8,
  },
  searchInput: {
    flex: 1,
    color: "#ffffff",
    fontSize: 14,
    paddingVertical: 8,
  },
  searchPlaceholder: {
    color: "#9ca3af",
    fontSize: 14,
    paddingVertical: 8,
  },
  searchWrapSpacer: {
    flex: 1,
  },
  right: {
    flexShrink: 0,
  },
  rightSpacer: {
    width: 20,
  },
});