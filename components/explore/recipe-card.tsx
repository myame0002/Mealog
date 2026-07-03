import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Colors } from "@/constants/theme";
import { Recipe, Ingredient } from "@/constants/storage";

interface RecipeCardProps {
  recipe: Recipe;
  ingredients: Ingredient[];
  onEdit: (recipe: Recipe) => void;
  onDelete: (id: string) => void;
}

export function RecipeCard({ recipe, ingredients, onEdit, onDelete }: RecipeCardProps) {
  const colors = Colors["light"];

  // Calculate default recipe calories
  const defaultCalories = Math.round(
    recipe.ingredients.reduce((sum, ri) => {
      const ing = ingredients.find((i) => i.id === ri.ingredientId);
      return sum + (ri.baseAmount * (ing?.caloriesPer100g || 0)) / 100;
    }, 0),
  );

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: "#fff",
          borderColor: "#e5e5ea",
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <View>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            {recipe.name}
          </Text>
          <Text style={[styles.cardSubTitle, { color: colors.icon }]}>
            標準：{defaultCalories} kcal
          </Text>
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => onEdit(recipe)}
          >
            <Ionicons
              name="create-outline"
              size={18}
              color={colors.tint}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => onDelete(recipe.id)}
          >
            <Ionicons
              name="trash-outline"
              size={18}
              color="#ff453a"
            />
          </TouchableOpacity>
        </View>
      </View>

      <View
        style={[styles.cardBody, { backgroundColor: "#F0FDF4" }]}
      >
        {recipe.ingredients.map((ri) => {
          const ing = ingredients.find(
            (i) => i.id === ri.ingredientId,
          );
          const kcal = Math.round(
            (ri.baseAmount * (ing?.caloriesPer100g || 0)) / 100,
          );
          return (
            <View key={ri.ingredientId} style={styles.ingRowDetail}>
              <Text
                style={[styles.ingRowName, { color: colors.text }]}
              >
                ・{ing ? ing.name : "不明な食材"}
              </Text>
              <Text
                style={[styles.ingRowAmt, { color: colors.icon }]}
              >
                {ri.baseAmount}g ({kcal} kcal)
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 15,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  cardSubTitle: {
    fontSize: 12,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: "row",
    gap: 6,
  },
  iconBtn: {
    padding: 6,
  },
  cardBody: {
    borderRadius: 12,
    padding: 12,
  },
  ingRowDetail: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  ingRowName: {
    fontSize: 13,
  },
  ingRowAmt: {
    fontSize: 13,
    fontWeight: "500",
  },
});