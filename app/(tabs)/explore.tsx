import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
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
  Ingredient,
  Recipe,
  RecipeIngredient,
  saveIngredient,
  saveRecipe,
} from "@/constants/storage";

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

  // --- INGREDIENT ACTIONS ---

  const handleOpenAddIng = () => {
    setEditingIngredientId(null);
    setIngName("");
    setIngCalories("");
    setIngProtein("");
    setIngFat("");
    setIngCarbs("");
    setIngModalVisible(true);
  };

  const handleOpenEditIng = (ing: Ingredient) => {
    setEditingIngredientId(ing.id);
    setIngName(ing.name);
    setIngCalories(String(ing.caloriesPer100g));
    setIngProtein(String(ing.proteinPer100g));
    setIngFat(String(ing.fatPer100g));
    setIngCarbs(String(ing.carbsPer100g));
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
    setBuilderSelectedIngId(ingredients[0]?.id || "");
    setBuilderAmount("100");
    setRecModalVisible(true);
  };

  const handleOpenEditRecipe = (recipe: Recipe) => {
    setEditingRecipeId(recipe.id);
    setRecName(recipe.name);
    setRecSelectedIngs([...recipe.ingredients]);
    setBuilderSelectedIngId(ingredients[0]?.id || "");
    setBuilderAmount("100");
    setRecModalVisible(true);
  };

  const handleAddIngToRecipe = () => {
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
    setIsSelectingIng(false);
  };

  const handleRemoveIngFromRecipe = (ingId: string) => {
    setRecSelectedIngs(
      recSelectedIngs.filter((item) => item.ingredientId !== ingId),
    );
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          マスタ管理
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.icon }]}>
          料理のテンプレートと食材データベース
        </Text>
      </View>

      {/* Segmented Tab Controller */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "recipes" && { backgroundColor: colors.tint },
            activeTab !== "recipes" && { backgroundColor: "#f0f0f0" },
          ]}
          onPress={() => setActiveTab("recipes")}
        >
          <Text
            style={[
              styles.tabButtonText,
              { color: activeTab === "recipes" ? "#fff" : colors.text },
            ]}
          >
            レシピマスタ ({recipes.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "ingredients" && { backgroundColor: colors.tint },
            activeTab !== "ingredients" && { backgroundColor: "#f0f0f0" },
          ]}
          onPress={() => setActiveTab("ingredients")}
        >
          <Text
            style={[
              styles.tabButtonText,
              { color: activeTab === "ingredients" ? "#fff" : colors.text },
            ]}
          >
            食材マスタ ({ingredients.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main List */}
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "recipes" ? (
          // 🍛 Recipes List View
          <View>
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: colors.tint }]}
              onPress={handleOpenAddRecipe}
            >
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
              <Text style={styles.addBtnText}>新しいレシピを作成</Text>
            </TouchableOpacity>

            {recipes.map((rec) => {
              // Calculate default recipe calories
              const defaultCalories = Math.round(
                rec.ingredients.reduce((sum, ri) => {
                  const ing = ingredients.find((i) => i.id === ri.ingredientId);
                  return (
                    sum + (ri.baseAmount * (ing?.caloriesPer100g || 0)) / 100
                  );
                }, 0),
              );

              return (
                <View
                  key={rec.id}
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
                        {rec.name}
                      </Text>
                      <Text
                        style={[styles.cardSubTitle, { color: colors.icon }]}
                      >
                        標準：{defaultCalories} kcal
                      </Text>
                    </View>
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={styles.iconBtn}
                        onPress={() => handleOpenEditRecipe(rec)}
                      >
                        <Ionicons
                          name="create-outline"
                          size={18}
                          color={colors.tint}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.iconBtn}
                        onPress={() => handleDeleteRecipe(rec.id)}
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
                    {rec.ingredients.map((ri) => {
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
            })}
          </View>
        ) : (
          // 🥩 Ingredients List View
          <View>
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: colors.tint }]}
              onPress={handleOpenAddIng}
            >
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
              <Text style={styles.addBtnText}>新しい食材を追加</Text>
            </TouchableOpacity>

            <View
              style={[
                styles.tableCard,
                { backgroundColor: "#fff", borderColor: "#e5e5ea" },
              ]}
            >
              {ingredients.map((ing, idx) => (
                <View
                  key={ing.id}
                  style={[
                    styles.tableRow,
                    { borderBottomColor: "#f2f2f7" },
                    idx === ingredients.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <View style={styles.tableInfo}>
                    <Text
                      style={[styles.tableNameText, { color: colors.text }]}
                    >
                      {ing.name}
                    </Text>
                    <Text style={[styles.tableCalText, { color: colors.icon }]}>
                      {ing.caloriesPer100g} kcal / 100g
                    </Text>
                    <Text style={[styles.tablePfcText, { color: colors.icon }]}>
                      P: {ing.proteinPer100g}g / F: {ing.fatPer100g}g / C: {ing.carbsPer100g}g
                    </Text>
                  </View>
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.iconBtn}
                      onPress={() => handleOpenEditIng(ing)}
                    >
                      <Ionicons
                        name="create-outline"
                        size={18}
                        color={colors.tint}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.iconBtn}
                      onPress={() => handleDeleteIngredient(ing.id)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color="#ff453a"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* 🥩 Ingredient Add/Edit Modal */}
      <Modal visible={ingModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalKeyboardContainer}
          >
            <View style={[styles.modalContent, { backgroundColor: "#fff" }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {editingIngredientId
                    ? "食材マスタの編集"
                    : "新しい食材の登録"}
                </Text>
                <TouchableOpacity onPress={() => setIngModalVisible(false)}>
                  <Ionicons name="close" size={24} color={colors.icon} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalForm}>
                <Text style={[styles.formLabel, { color: colors.text }]}>
                  食材名
                </Text>
                <TextInput
                  style={[
                    styles.formInput,
                    {
                      color: colors.text,
                      backgroundColor: "#f2f2f7",
                      borderColor: "#e5e5ea",
                    },
                  ]}
                  placeholder="例: 白米、鶏むね肉、アボカド"
                  placeholderTextColor={colors.icon}
                  value={ingName}
                  onChangeText={setIngName}
                />

                <Text style={[styles.formLabel, { color: colors.text }]}>
                  カロリー (100gあたり/kcal)
                </Text>
                <TextInput
                  style={[
                    styles.formInput,
                    {
                      color: colors.text,
                      backgroundColor: "#f2f2f7",
                      borderColor: "#e5e5ea",
                    },
                  ]}
                  keyboardType="numeric"
                  placeholder="例: 156"
                  placeholderTextColor={colors.icon}
                  value={ingCalories}
                  onChangeText={setIngCalories}
                />

                <Text style={[styles.formLabel, { color: colors.text }]}>
                  たんぱく質 (100gあたり/g)
                </Text>
                <TextInput
                  style={[
                    styles.formInput,
                    {
                      color: colors.text,
                      backgroundColor: "#f2f2f7",
                      borderColor: "#e5e5ea",
                    },
                  ]}
                  keyboardType="numeric"
                  placeholder="例: 23"
                  placeholderTextColor={colors.icon}
                  value={ingProtein}
                  onChangeText={setIngProtein}
                />

                <Text style={[styles.formLabel, { color: colors.text }]}>
                  脂質 (100gあたり/g)
                </Text>
                <TextInput
                  style={[
                    styles.formInput,
                    {
                      color: colors.text,
                      backgroundColor: "#f2f2f7",
                      borderColor: "#e5e5ea",
                    },
                  ]}
                  keyboardType="numeric"
                  placeholder="例: 1"
                  placeholderTextColor={colors.icon}
                  value={ingFat}
                  onChangeText={setIngFat}
                />

                <Text style={[styles.formLabel, { color: colors.text }]}>
                  炭水化物 (100gあたり/g)
                </Text>
                <TextInput
                  style={[
                    styles.formInput,
                    {
                      color: colors.text,
                      backgroundColor: "#f2f2f7",
                      borderColor: "#e5e5ea",
                    },
                  ]}
                  keyboardType="numeric"
                  placeholder="例: 36"
                  placeholderTextColor={colors.icon}
                  value={ingCarbs}
                  onChangeText={setIngCarbs}
                />

                <TouchableOpacity
                  style={[
                    styles.formSubmitBtn,
                    { backgroundColor: colors.tint },
                  ]}
                  onPress={handleSaveIngredient}
                >
                  <Text style={styles.formSubmitBtnText}>保存する</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* 🍛 Recipe Add/Edit Modal (Recipe Builder) */}
      <Modal visible={recModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalContent,
              styles.recipeBuilderContent,
              { backgroundColor: "#fff" },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingRecipeId ? "レシピの編集" : "新しいレシピを作成"}
              </Text>
              <TouchableOpacity onPress={() => setRecModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.icon} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 30 }}
            >
              <Text
                style={[
                  styles.formLabel,
                  { color: colors.text, marginBottom: 8 },
                ]}
              >
                レシピ名
              </Text>
              <TextInput
                style={[
                  styles.formInput,
                  {
                    color: colors.text,
                    backgroundColor: "#f2f2f7",
                    borderColor: "#e5e5ea",
                    marginBottom: 16,
                  },
                ]}
                placeholder="例: 高タンパクチキンカレー"
                placeholderTextColor={colors.icon}
                value={recName}
                onChangeText={setRecName}
              />

              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.formLabel, { color: colors.text }]}>
                  配合する材料
                </Text>
                <TouchableOpacity
                  style={[styles.smallAddBtn, { backgroundColor: colors.tint }]}
                  onPress={() => setIsSelectingIng(true)}
                >
                  <Ionicons name="add" size={14} color="#fff" />
                  <Text style={styles.smallAddBtnText}>材料追加</Text>
                </TouchableOpacity>
              </View>

              {/* List of currently selected ingredients in the recipe builder */}
              <View
                style={[styles.builderIngsList, { backgroundColor: "#F0FDF4" }]}
              >
                {recSelectedIngs.length === 0 ? (
                  <Text
                    style={[
                      styles.emptySectionText,
                      {
                        color: colors.icon,
                        textAlign: "center",
                        paddingVertical: 15,
                      },
                    ]}
                  >
                    材料が追加されていません
                  </Text>
                ) : (
                  recSelectedIngs.map((ri) => {
                    const ing = ingredients.find(
                      (i) => i.id === ri.ingredientId,
                    );
                    const kcal = Math.round(
                      (ri.baseAmount * (ing?.caloriesPer100g || 0)) / 100,
                    );
                    return (
                      <View key={ri.ingredientId} style={styles.builderIngRow}>
                        <View>
                          <Text
                            style={[
                              styles.builderIngName,
                              { color: colors.text },
                            ]}
                          >
                            {ing ? ing.name : "不明"}
                          </Text>
                          <Text
                            style={[
                              styles.builderIngCalText,
                              { color: colors.icon },
                            ]}
                          >
                            {ri.baseAmount}g ({kcal} kcal)
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() =>
                            handleRemoveIngFromRecipe(ri.ingredientId)
                          }
                        >
                          <Ionicons
                            name="close-circle-outline"
                            size={20}
                            color="#ff453a"
                          />
                        </TouchableOpacity>
                      </View>
                    );
                  })
                )}
              </View>

              {/* Builder Add Ingredient Sub-Form (inline toggle) */}
              {isSelectingIng && (
                <View
                  style={[
                    styles.inlineSelectorCard,
                    { backgroundColor: "#f0f0f5", borderColor: colors.tint },
                  ]}
                >
                  <Text
                    style={[styles.inlineSelectorTitle, { color: colors.text }]}
                  >
                    材料とベース量を選択
                  </Text>

                  {ingredients.length === 0 ? (
                    <Text
                      style={{
                        color: colors.icon,
                        fontSize: 13,
                        marginBottom: 10,
                      }}
                    >
                      まず食材マスタに食材を追加してください。
                    </Text>
                  ) : (
                    <View style={styles.dropdownContainer}>
                      <Text style={[styles.tinyLabel, { color: colors.icon }]}>
                        食材名
                      </Text>
                      {/* Using custom list selectors instead of a complicated picker dependency */}
                      <ScrollView
                        style={styles.miniScrollView}
                        nestedScrollEnabled={true}
                      >
                        {ingredients.map((ing) => {
                          const isSelected = builderSelectedIngId === ing.id;
                          return (
                            <TouchableOpacity
                              key={ing.id}
                              style={[
                                styles.miniIngSelectRow,
                                isSelected && { backgroundColor: colors.tint },
                              ]}
                              onPress={() => setBuilderSelectedIngId(ing.id)}
                            >
                              <Text
                                style={{
                                  fontSize: 12,
                                  color: isSelected ? "#fff" : colors.text,
                                  fontWeight: isSelected ? "bold" : "normal",
                                }}
                              >
                                {ing.name} ({ing.caloriesPer100g} kcal/100g)
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  )}

                  <View style={styles.builderQtyRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.tinyLabel, { color: colors.icon }]}>
                        基本グラム数 (g)
                      </Text>
                      <TextInput
                        keyboardType="numeric"
                        style={[
                          styles.formInput,
                          {
                            color: colors.text,
                            backgroundColor: "#fff",
                            borderColor: "#d1d1d6",
                            paddingVertical: 6,
                            fontSize: 14,
                          },
                        ]}
                        value={builderAmount}
                        onChangeText={setBuilderAmount}
                      />
                    </View>
                  </View>

                  <View style={styles.inlineActionRow}>
                    <TouchableOpacity
                      style={[
                        styles.inlineActionBtn,
                        { backgroundColor: "#e5e5ea" },
                      ]}
                      onPress={() => setIsSelectingIng(false)}
                    >
                      <Text
                        style={[
                          styles.inlineActionBtnText,
                          { color: colors.text },
                        ]}
                      >
                        キャンセル
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.inlineActionBtn,
                        { backgroundColor: colors.tint },
                      ]}
                      onPress={handleAddIngToRecipe}
                    >
                      <Text
                        style={[styles.inlineActionBtnText, { color: "#fff" }]}
                      >
                        レシピに加える
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Submit Recipe */}
              <TouchableOpacity
                style={[
                  styles.formSubmitBtn,
                  { backgroundColor: colors.tint, marginTop: 24 },
                ]}
                onPress={handleSaveRecipe}
              >
                <Text style={styles.formSubmitBtnText}>レシピを保存する</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 10,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: "bold",
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  addBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
    marginBottom: 16,
  },
  addBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
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
  tableCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
  },
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalKeyboardContainer: {
    width: "100%",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    width: "100%",
  },
  recipeBuilderContent: {
    height: "85%",
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
  modalForm: {
    gap: 12,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  formInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 15,
  },
  formSubmitBtn: {
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
  },
  formSubmitBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    marginTop: 8,
  },
  smallAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  smallAddBtnText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },
  builderIngsList: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  emptySectionText: {
    fontSize: 13,
    fontStyle: "italic",
  },
  builderIngRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(120, 120, 128, 0.1)",
    paddingBottom: 8,
  },
  builderIngName: {
    fontSize: 14,
    fontWeight: "500",
  },
  builderIngCalText: {
    fontSize: 11,
    marginTop: 2,
  },
  inlineSelectorCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
    gap: 10,
  },
  inlineSelectorTitle: {
    fontSize: 13,
    fontWeight: "bold",
  },
  dropdownContainer: {
    gap: 4,
  },
  tinyLabel: {
    fontSize: 10,
    fontWeight: "bold",
  },
  miniScrollView: {
    maxHeight: 120,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(120,120,128,0.2)",
  },
  miniIngSelectRow: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(120,120,128,0.1)",
  },
  builderQtyRow: {
    flexDirection: "row",
    gap: 10,
  },
  inlineActionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 4,
  },
  inlineActionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  inlineActionBtnText: {
    fontSize: 12,
    fontWeight: "bold",
  },
});