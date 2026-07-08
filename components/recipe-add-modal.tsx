import {
  Ingredient,
  LogItem,
  Recipe,
  calculateItemCalories,
} from "@/constants/storage";
import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const MEAL_TYPES = [
  { key: "breakfast", label: "朝食" },
  { key: "lunch", label: "昼食" },
  { key: "dinner", label: "夕食" },
  { key: "snack", label: "間食・その他" },
] as const;

type RecipeAddModalProps = {
  visible: boolean;
  activeMealType: string;
  recipes: Recipe[];
  ingredients: Ingredient[];
  recipeSearchQuery: string;
  colors: any;
  onClose: () => void;
  onSearchChange: (text: string) => void;
  onSelectRecipe: (recipe: Recipe) => void;
};

export default function RecipeAddModal({
  visible,
  activeMealType,
  recipes,
  ingredients,
  recipeSearchQuery,
  colors,
  onClose,
  onSearchChange,
  onSelectRecipe,
}: RecipeAddModalProps) {
  const mealLabel =
    MEAL_TYPES.find((m) => m.key === activeMealType)?.label || "食事";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View
          style={[
            styles.modalContent,
            styles.recipeModalContent,
            { backgroundColor: "#fff" },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {mealLabel} - レシピ一覧から選択
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.icon} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.modalSearchContainer}>
            <View
              style={[
                styles.searchBar,
                { backgroundColor: "#F3F4F6", borderColor: "#E5E7EB" },
              ]}
            >
              <Ionicons
                name="search-outline"
                size={16}
                color={colors.icon}
                style={styles.searchIcon}
              />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="レシピ名で検索..."
                placeholderTextColor={colors.icon}
                value={recipeSearchQuery}
                onChangeText={onSearchChange}
              />
              {recipeSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => onSearchChange("")}>
                  <Ionicons name="close-circle" size={16} color={colors.icon} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <ScrollView
            contentContainerStyle={styles.recipeListContainer}
            showsVerticalScrollIndicator={false}
          >
            {(() => {
              const filteredRecipes = recipes.filter((r) =>
                r.name.toLowerCase().includes(recipeSearchQuery.toLowerCase()),
              );

              if (filteredRecipes.length === 0) {
                return (
                  <Text
                    style={[
                      styles.emptySectionText,
                      { color: colors.icon, textAlign: "center", padding: 20 },
                    ]}
                  >
                    {recipeSearchQuery
                      ? "一致するレシピが見つかりません"
                      : "レシピが登録されていません。レシピ管理タブから作成してください。"}
                  </Text>
                );
              }

              return filteredRecipes.map((recipe) => {
                // Calculate initial preset calories
                const tempLogItem: Omit<LogItem, "calories"> = {
                  id: "temp",
                  mealType: "breakfast",
                  type: "recipe",
                  name: recipe.name,
                  protein: 0,
                  fat: 0,
                  carbs: 0,
                  ingredients: recipe.ingredients.map((ri) => {
                    const matched = ingredients.find(
                      (i) => i.id === ri.ingredientId,
                    );
                    return {
                      ingredientId: ri.ingredientId,
                      name: matched ? matched.name : "",
                      amount: ri.baseAmount,
                      caloriesPer100g: matched ? matched.caloriesPer100g : 0,
                      proteinPer100g: matched ? matched.proteinPer100g : 0,
                      fatPer100g: matched ? matched.fatPer100g : 0,
                      carbsPer100g: matched ? matched.carbsPer100g : 0,
                    };
                  }),
                };
                const calVal = calculateItemCalories(tempLogItem as LogItem);

                return (
                  <TouchableOpacity
                    key={recipe.id}
                    style={[
                      styles.recipeCard,
                      {
                        backgroundColor: "#f2f2f7",
                        borderColor: "#e5e5ea",
                      },
                    ]}
                    onPress={() => onSelectRecipe(recipe)}
                  >
                    <View>
                      <Text
                        style={[styles.recipeCardName, { color: colors.text }]}
                      >
                        {recipe.name}
                      </Text>
                      <Text
                        style={[styles.recipeCardIngs, { color: colors.icon }]}
                      >
                        材料:{" "}
                        {tempLogItem.ingredients
                          ?.map((i) => `${i.name}(${i.amount}g)`)
                          .join(", ")}
                      </Text>
                    </View>
                    <View style={styles.alignRight}>
                      <Text
                        style={[styles.recipeCardKcal, { color: colors.tint }]}
                      >
                        {calVal} kcal
                      </Text>
                      <Text
                        style={[
                          styles.recipeCardAddText,
                          { color: colors.icon },
                        ]}
                      >
                        ＋ 追加
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              });
            })()}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    width: "100%",
  },
  recipeModalContent: {
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  modalSearchContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  recipeListContainer: {
    gap: 10,
    paddingBottom: 20,
  },
  emptySectionText: {
    fontSize: 13,
    textAlign: "left",
    paddingVertical: 10,
    fontStyle: "italic",
  },
  recipeCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recipeCardName: {
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 4,
  },
  recipeCardIngs: {
    fontSize: 11,
    maxWidth: 220,
  },
  recipeCardKcal: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 2,
  },
  recipeCardAddText: {
    fontSize: 11,
    fontWeight: "bold",
  },
  alignRight: {
    alignItems: "flex-end",
  },
});
