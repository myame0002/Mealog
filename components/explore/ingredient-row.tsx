import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Colors } from "@/constants/theme";
import { Ingredient } from "@/constants/storage";

interface IngredientRowProps {
  ingredient: Ingredient;
  index: number;
  totalCount: number;
  onEdit: (ingredient: Ingredient) => void;
  onDelete: (id: string) => void;
}

export function IngredientRow({
  ingredient,
  index,
  totalCount,
  onEdit,
  onDelete,
}: IngredientRowProps) {
  const colors = Colors["light"];
  const isLast = index === totalCount - 1;

  return (
    <View
      style={[
        styles.tableRow,
        { borderBottomColor: "#f2f2f7" },
        isLast && { borderBottomWidth: 0 },
      ]}
    >
      <View style={styles.tableInfo}>
        <Text style={[styles.tableNameText, { color: colors.text }]}>
          {ingredient.name}
        </Text>
        <Text style={[styles.tableCalText, { color: colors.icon }]}>
          {ingredient.caloriesPer100g} kcal / 100g
        </Text>
        <Text style={[styles.tablePfcText, { color: colors.icon }]}>
          P: {ingredient.proteinPer100g}g / F: {ingredient.fatPer100g}g / C:{" "}
          {ingredient.carbsPer100g}g
        </Text>
        {ingredient.servingSize && (
          <Text style={[styles.tableServingText, { color: colors.icon }]}>
            目安: {ingredient.servingSize} ({ingredient.servingAmount}g)
          </Text>
        )}
      </View>
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => onEdit(ingredient)}
        >
          <Ionicons
            name="create-outline"
            size={18}
            color={colors.tint}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => onDelete(ingredient.id)}
        >
          <Ionicons
            name="trash-outline"
            size={18}
            color="#ff453a"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tableInfo: {
    flex: 1,
  },
  tableNameText: {
    fontSize: 15,
    fontWeight: "600",
  },
  tableCalText: {
    fontSize: 12,
    marginTop: 2,
  },
  tablePfcText: {
    fontSize: 10,
    marginTop: 1,
  },
  tableServingText: {
    fontSize: 10,
    marginTop: 1,
    fontStyle: "italic",
  },
  actionRow: {
    flexDirection: "row",
    gap: 6,
  },
  iconBtn: {
    padding: 6,
  },
});