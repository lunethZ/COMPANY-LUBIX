import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "../context/ThemeContext";

const STEPS = ["Resumen", "Envío", "Pago"];

export default function CheckoutHeader({ step }: { step: number }) {
  const navigation = useNavigation();
  const { C } = useTheme();

  return (
    <View style={[styles.header, { backgroundColor: C.navbar, borderBottomColor: C.border }]}>
      <View style={styles.topRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
          <Text style={[styles.back, { color: C.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: C.text }]}>Checkout</Text>
        <View style={{ width: 28 }} />
      </View>
      <View style={styles.stepsRow}>
        {STEPS.map((label, index) => {
          const done = index < step;
          const active = index === step;
          return (
            <React.Fragment key={label}>
              {index > 0 && <View style={[styles.line, { backgroundColor: done ? C.accent : C.border }]} />}
              <View style={styles.step}>
                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor: active ? C.accent : done ? C.accent : C.border,
                    },
                  ]}
                >
                  {done ? (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  ) : (
                    <Text style={[styles.dotText, { color: active || done ? "#fff" : C.textSecondary }]}>
                      {index + 1}
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    { color: active || done ? C.text : C.textSecondary },
                  ]}
                >
                  {label}
                </Text>
              </View>
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 46,
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 18, fontWeight: "800" },
  back: { fontSize: 22, fontWeight: "700" },
  stepsRow: { flexDirection: "row", alignItems: "center", marginTop: 14 },
  step: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dotText: { fontSize: 12, fontWeight: "800" },
  stepLabel: { fontSize: 12, fontWeight: "600" },
  line: { flex: 1, height: 2, marginHorizontal: 8, borderRadius: 2 },
});