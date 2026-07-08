import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Colors } from "@/constants/theme";
import {
  deleteIngredient,
  deleteRecipe,
  getIngredients,
  getRecipes,
  initStorage,
  Ingredient,
  Recipe,
  RecipeIngredient,
  saveIngredient,
  saveRecipe,
} from "@/constants/storage";
import { RecipeCard } from "@/components/explore/recipe-card";
import { IngredientRow } from "@/components/explore/ingredient-row";
import { IngredientModal } from "@/components/explore/ingredient-modal";
import { RecipeBuilderModal } from "@/components/explore/recipe-builder-modal";
import { TabController } from "@/components/explore/tab-controller";

export default function ExploreScreen() {
  const colors = Colors["light"];
  const insets = useSafeAreaInsets();

  // Screen Tabs
  const [activeTab, setActiveTab] = useState<"ingredients" | "recipes">(
    "recipes",
  );
  const [loading, setLoading] = useState(true);

  // Core Data Lists
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");

  // Modals visibility
  const [ingModalVisible, setIngModalVisible] = useState(false);
  const [recModalVisible, setRecModalVisible] = useState(false);

  // Ingredient Form State
  const [editingIngredientId, setEditingIngredientId] = useState<string | null>(
    null,
  );
  const [ingName, setIngName] = useState("");
  const [ingCalories, setIngCalories] = useState("");
  const [ingProtein, setIngProtein] = useState("");
  const [ingFat, setIngFat] = useState("");
  const [ingCarbs, setIngCarbs] = useState("");
  const [ingServingSize, setIngServingSize] = useState("");
  const [ingServingAmount, setIngServingAmount] = useState("");

  // Recipe Form State
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
  const [recName, setRecName] = useState("");
  const [recSelectedIngs, setRecSelectedIngs] = useState<RecipeIngredient[]>(
    [],
  );

  // Temp Ingredient selection for recipe builder
  const [builderSelectedIngId, setBuilderSelectedIngId] = useState("");
  const [builderAmount, setBuilderAmount] = useState("");
  const [isSelectingIng, setIsSelectingIng] = useState(false);
  
  // Ingredient weight adjustment in recipe builder
  const [editingIngWeightId, setEditingIngWeightId] = useState<string | null>(null);
  const [tempIngWeight, setTempIngWeight] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const ings = await getIngredients();
    const recs = await getRecipes();
    setIngredients(ings);
    setRecipes(recs);
    setLoading(false);
  };

  // Filter recipes based on search query (新しい登録順 = reverse)
  const filteredRecipes = recipes
    .filter((recipe) =>
      recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .reverse();

  // Filter ingredients based on search query
  const filteredIngredients = ingredients.filter((ingredient) =>
    ingredient.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- INGREDIENT ACTIONS ---

  const handleOpenAddIng = () => {
    setEditingIngredientId(null);
    setIngName("");
    setIngCalories("");
    setIngProtein("");
    setIngFat("");
    setIngCarbs("");
    setIngServingSize("");
    setIngServingAmount("");
    setIngModalVisible(true);
  };

  const handleOpenEditIng = (ing: Ingredient) => {
    setEditingIngredientId(ing.id);
    setIngName(ing.name);
    setIngCalories(String(ing.caloriesPer100g));
    setIngProtein(String(ing.proteinPer100g));
    setIngFat(String(ing.fatPer100g));
    setIngCarbs(String(ing.carbsPer100g));
    setIngServingSize(ing.servingSize || "");
    setIngServingAmount(ing.servingAmount ? String(ing.servingAmount) : "");
    setIngModalVisible(true);
  };

  const handleSaveIngredient = async () => {
    if (!ingName.trim() || !ingCalories.trim()) {
      Alert.alert("入力エラー", "材料名とカロリーを入力してください。");
      return;
    }

    const kcal = parseInt(ingCalories, 10);
    if (isNaN(kcal) || kcal < 0) {
      Alert.alert("入力エラー", "カロリーには正しい数値を入力してください。");
      return;
    }

    const protein = ingProtein.trim() ? parseFloat(ingProtein) : 0;
    const fat = ingFat.trim() ? parseFloat(ingFat) : 0;
    const carbs = ingCarbs.trim() ? parseFloat(ingCarbs) : 0;

    if (isNaN(protein) || isNaN(fat) || isNaN(carbs)) {
      Alert.alert("入力エラー", "PFCには正しい数値を入力してください。");
      return;
    }

    const ing: Ingredient = {
      id: editingIngredientId || `ing_${Date.now()}`,
      name: ingName.trim(),
      caloriesPer100g: kcal,
      proteinPer100g: protein,
      fatPer100g: fat,
      carbsPer100g: carbs,
      ...(ingServingSize.trim() && { servingSize: ingServingSize.trim() }),
      ...(ingServingAmount.trim() && { servingAmount: parseFloat(ingServingAmount) }),
    };

    try {
      const updated = await saveIngredient(ing);
      setIngredients(updated);
      setIngModalVisible(false);
      // Reload recipes too because recipe calories are computed based on ingredients
      const recs = await getRecipes();
      setRecipes(recs);
    } catch {
      Alert.alert("エラー", "保存に失敗しました。");
    }
  };

  const handleDeleteIngredient = (id: string) => {
    // Check if ingredient is used in any recipe
    const usedIn = recipes.filter((r) =>
      r.ingredients.some((ri) => ri.ingredientId === id),
    );

    if (usedIn.length > 0) {
      const recipeNames = usedIn.map((r) => r.name).join(", ");
      Alert.alert(
        "削除できません",
        `この材料は以下のレシピで使用されています：\n${recipeNames}`,
      );
      return;
    }

    Alert.alert("材料の削除", "本当にこの材料を削除しますか？", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: async () => {
          try {
            const updated = await deleteIngredient(id);
            setIngredients(updated);
          } catch {
            Alert.alert("エラー", "削除に失敗しました。");
          }
        },
      },
    ]);
  };

  // --- RECIPE ACTIONS ---

  const handleOpenAddRecipe = () => {
    setEditingRecipeId(null);
    setRecName("");
    setRecSelectedIngs([]);
    setBuilderSelectedIngId("");
    setBuilderAmount("100");
    setIsSelectingIng(false);
    setRecModalVisible(true);
  };

  const handleOpenEditRecipe = (recipe: Recipe) => {
    setEditingRecipeId(recipe.id);
    setRecName(recipe.name);
    setRecSelectedIngs([...recipe.ingredients]);
    setBuilderSelectedIngId("");
    setBuilderAmount("100");
    setIsSelectingIng(false);
    setRecModalVisible(true);
  };

  const handleAddIngToRecipe = () => {
    // If no ingredient selected, show error
    if (!builderSelectedIngId) {
      Alert.alert("エラー", "材料を選択してください。");
      return;
    }
    
    const amt = parseInt(builderAmount, 10);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert("入力エラー", "正しいグラム数を入力してください。");
      return;
    }

    // Check if already added
    if (recSelectedIngs.some((i) => i.ingredientId === builderSelectedIngId)) {
      Alert.alert(
        "重複",
        "この材料はすでに追加されています。リスト内で調整するか、一度削除してください。",
      );
      return;
    }

    const newItem: RecipeIngredient = {
      ingredientId: builderSelectedIngId,
      baseAmount: amt,
    };

    setRecSelectedIngs([...recSelectedIngs, newItem]);
    // キャンセルを押すまで材料選択を閉じない
  };

  const handleRemoveIngFromRecipe = (ingId: string) => {
    setRecSelectedIngs(
      recSelectedIngs.filter((item) => item.ingredientId !== ingId),
    );
  };

  const handleUpdateIngWeight = (ingId: string, newWeight: number) => {
    const weight = Math.max(0, Math.round(newWeight));
    setRecSelectedIngs(
      recSelectedIngs.map((ing) =>
        ing.ingredientId === ingId ? { ...ing, baseAmount: weight } : ing,
      ),
    );
    // Also update the temp input if this ingredient is being edited
    if (editingIngWeightId === ingId) {
      setTempIngWeight(String(weight));
    }
  };

  const handleStartEditWeight = (ingId: string, currentAmount: number) => {
    setEditingIngWeightId(ingId);
    setTempIngWeight(String(currentAmount));
  };

  const handleSaveWeightEdit = () => {
    if (!editingIngWeightId || !tempIngWeight.trim()) {
      setEditingIngWeightId(null);
      return;
    }

    const newWeight = parseInt(tempIngWeight, 10);
    if (isNaN(newWeight) || newWeight < 0) {
      Alert.alert("入力エラー", "正しいグラム数を入力してください。");
      return;
    }

    handleUpdateIngWeight(editingIngWeightId, newWeight);
    setEditingIngWeightId(null);
  };

  const handleSaveRecipe = async () => {
    if (!recName.trim()) {
      Alert.alert("入力エラー", "レシピ名を入力してください。");
      return;
    }

    if (recSelectedIngs.length === 0) {
      Alert.alert("入力エラー", "材料を少なくとも1つ追加してください。");
      return;
    }

    const recipe: Recipe = {
      id: editingRecipeId || `rec_${Date.now()}`,
      name: recName.trim(),
      ingredients: recSelectedIngs,
    };

    try {
      const updated = await saveRecipe(recipe);
      setRecipes(updated);
      setRecModalVisible(false);
    } catch {
      Alert.alert("エラー", "レシピの保存に失敗しました。");
    }
  };

  const handleDeleteRecipe = (id: string) => {
    Alert.alert("レシピの削除", "本当にこのレシピを削除しますか？", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: async () => {
          try {
            const updated = await deleteRecipe(id);
            setRecipes(updated);
          } catch {
            Alert.alert("エラー", "削除に失敗しました。");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            マスタ管理
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.icon }]}>
            料理のテンプレートと食材データベース
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={[
          styles.floatingResetButton,
          { top: insets.top + 12 }
        ]}
        onPress={() =>
          Alert.alert(
            'データリセット',
            '全てのデータを初期状態に戻しますか？この操作は取り消せません。',
            [
              { text: 'キャンセル', style: 'cancel' },
              {
                text: 'リセット',
                style: 'destructive',
                onPress: async () => {
                  await initStorage(true);
                  Alert.alert('完了', 'データを初期状態にリセットしました。アプリを再起動してください。');
                },
              },
            ]
          )
        }>
        <Ionicons name="refresh" size={20} color={colors.tint} />
      </TouchableOpacity>

      {/* Segmented Tab Controller */}
      <TabController
        activeTab={activeTab}
        recipesCount={recipes.length}
        ingredientsCount={ingredients.length}
        onTabChange={setActiveTab}
      />

      {/* Add Button */}
      <View style={styles.addButtonContainer}>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.tint }]}
          onPress={
            activeTab === "recipes" ? handleOpenAddRecipe : handleOpenAddIng
          }>
          <Ionicons name="add-circle-outline" size={20} color="#fff" />
          <Text style={styles.addBtnText}>
            {activeTab === "recipes"
              ? "新しいレシピを作成"
              : "新しい食材を追加"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' }]}>
          <Ionicons name="search-outline" size={16} color={colors.icon} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={
              activeTab === "recipes"
                ? "レシピを検索..."
                : "食材を検索..."
            }
            placeholderTextColor={colors.icon}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={16} color={colors.icon} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main List */}
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}>
        {activeTab === "recipes" ? (
          // 🍛 Recipes List View
          <View>
            {filteredRecipes.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={48} color={colors.icon} />
                <Text style={[styles.emptyStateText, { color: colors.icon }]}>
                  {searchQuery.length > 0
                    ? "一致するレシピが見つかりません"
                    : "レシピがありません"}
                </Text>
              </View>
            ) : (
              filteredRecipes.map((rec) => (
                <RecipeCard
                  key={rec.id}
                  recipe={rec}
                  ingredients={ingredients}
                  onEdit={handleOpenEditRecipe}
                  onDelete={handleDeleteRecipe}
                />
              ))
            )}
          </View>
        ) : (
          // 🥩 Ingredients List View
          <View
            style={[
              styles.tableCard,
              { backgroundColor: "#fff", borderColor: "#e5e5ea" },
            ]}
          >
            {filteredIngredients.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={48} color={colors.icon} />
                <Text style={[styles.emptyStateText, { color: colors.icon }]}>
                  {searchQuery.length > 0
                    ? "一致する食材が見つかりません"
                    : "食材がありません"}
                </Text>
              </View>
            ) : (
              filteredIngredients.map((ing, idx) => (
                <IngredientRow
                  key={ing.id}
                  ingredient={ing}
                  index={idx}
                  totalCount={filteredIngredients.length}
                  onEdit={handleOpenEditIng}
                  onDelete={handleDeleteIngredient}
                />
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* 🥩 Ingredient Add/Edit Modal */}
      <IngredientModal
        visible={ingModalVisible}
        editingIngredient={editingIngredientId ? {
          id: editingIngredientId,
          name: ingName,
          caloriesPer100g: parseInt(ingCalories) || 0,
          proteinPer100g: parseFloat(ingProtein) || 0,
          fatPer100g: parseFloat(ingFat) || 0,
          carbsPer100g: parseFloat(ingCarbs) || 0,
          ...(ingServingSize.trim() && { servingSize: ingServingSize.trim() }),
          ...(ingServingAmount.trim() && { servingAmount: parseFloat(ingServingAmount) }),
        } : null}
        formData={{
          name: ingName,
          calories: ingCalories,
          protein: ingProtein,
          fat: ingFat,
          carbs: ingCarbs,
          servingSize: ingServingSize,
          servingAmount: ingServingAmount,
        }}
        onClose={() => setIngModalVisible(false)}
        onSave={handleSaveIngredient}
        onFormChange={(field, value) => {
          switch (field) {
            case "name": setIngName(value); break;
            case "calories": setIngCalories(value); break;
            case "protein": setIngProtein(value); break;
            case "fat": setIngFat(value); break;
            case "carbs": setIngCarbs(value); break;
            case "servingSize": setIngServingSize(value); break;
            case "servingAmount": setIngServingAmount(value); break;
          }
        }}
      />

      {/* 🍛 Recipe Add/Edit Modal (Recipe Builder) */}
      <RecipeBuilderModal
        visible={recModalVisible}
        editingRecipe={editingRecipeId ? {
          id: editingRecipeId,
          name: recName,
          ingredients: recSelectedIngs,
        } : null}
        recipeName={recName}
        selectedIngredients={recSelectedIngs}
        builderSelectedIngId={builderSelectedIngId}
        builderAmount={builderAmount}
        isSelectingIng={isSelectingIng}
        editingIngWeightId={editingIngWeightId}
        tempIngWeight={tempIngWeight}
        ingredients={ingredients}
        onClose={() => setRecModalVisible(false)}
        onSave={handleSaveRecipe}
        onRecipeNameChange={setRecName}
        onAddIngToRecipe={handleAddIngToRecipe}
        onRemoveIngFromRecipe={handleRemoveIngFromRecipe}
        onUpdateIngWeight={handleUpdateIngWeight}
        onStartEditWeight={handleStartEditWeight}
        onSaveWeightEdit={handleSaveWeightEdit}
        onSelectIngredient={setBuilderSelectedIngId}
        onBuilderAmountChange={setBuilderAmount}
        onCancelIngSelection={() => setIsSelectingIng(false)}
        onStartIngSelection={() => setIsSelectingIng(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 5,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 2,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  addButtonContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  addBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
  },
  addBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  tableCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
  },
  floatingResetButton: {
    position: 'absolute',
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
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
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 15,
    fontWeight: "500",
  },
});