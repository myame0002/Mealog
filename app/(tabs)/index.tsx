import { BannerAdView } from "@/components/banner-ad";
import CaloriesProgress from "@/components/calories-progress";
import DateCarousel from "@/components/date-carousel";
import ManualAddModal from "@/components/manual-add-modal";
import MealSection from "@/components/meal-section";
import RecipeAddModal from "@/components/recipe-add-modal";
import SettingsModal from "@/components/settings-modal";
import BarcodeScannerModal from "@/components/barcode-scanner-modal";
import {
    DailyTargets,
    Ingredient,
    LogItem,
    Product,
    Recipe,
    calculateItemCalories,
    calculateItemPFC,
    getAllDayLogs,
    getDailyTargets,
    getDayLog,
    getIngredients,
    getProducts,
    getRecipes,
    initStorage,
    saveDailyTargets,
    saveDayLog,
} from "@/constants/storage";
import { Colors } from "@/constants/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useEffect, useMemo, useState } from "react";
import {
    Alert,
    AppState,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MEAL_TYPES = [
  { key: "breakfast", label: "朝食", icon: "sunny", color: "#FF9500" },
  { key: "lunch", label: "昼食", icon: "restaurant", color: "#34C759" },
  { key: "dinner", label: "夕食", icon: "moon", color: "#5856D6" },
  { key: "snack", label: "間食・その他", icon: "cafe", color: "#AF52DE" },
] as const;

export default function HomeScreen() {
  const theme = "light";
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();

  // App States
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loggedDates, setLoggedDates] = useState<string[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // UI Control States
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [recipeModalVisible, setRecipeModalVisible] = useState(false);
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [barcodeScannerVisible, setBarcodeScannerVisible] = useState(false);
  const [activeMealType, setActiveMealType] =
    useState<LogItem["mealType"]>("breakfast");

  // Input states for Manual Modal
  const [manualName, setManualName] = useState("");
  const [manualCalories, setManualCalories] = useState("");
  const [manualProtein, setManualProtein] = useState("");
  const [manualFat, setManualFat] = useState("");
  const [manualCarbs, setManualCarbs] = useState("");

  // Search state for Recipe Modal
  const [recipeSearchQuery, setRecipeSearchQuery] = useState("");

  // Barcode scanned product name
  const [scannedProductName, setScannedProductName] = useState("");

  // Add ingredient to recipe states
  const [showAddIngToRecipe, setShowAddIngToRecipe] = useState<string | null>(
    null,
  );
  const [selectedIngForRecipe, setSelectedIngForRecipe] = useState("");
  const [recipeIngAmount, setRecipeIngAmount] = useState("");

  // Daily targets
  const [dailyTargets, setDailyTargets] = useState<DailyTargets>({
    calories: 2000,
    protein: 50,
    fat: 50,
    carbs: 250,
  });

  // Initialize storage and set today's date
  useEffect(() => {
    const startup = async () => {
      await initStorage();
      const today = new Date();
      const todayStr = formatDateString(today);
      setSelectedDate(todayStr);
      await loadMasterData();
      await loadLogs(todayStr);
      await loadLoggedDates();
      await loadDailyTargets();
      setLoading(false);
    };
    startup();

    // アプリがフォアグラウンドに戻ったときにマスタデータを再読み込み
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        loadMasterData();
      }
    });

    return () => subscription.remove();
  }, []);

  const loadMasterData = async () => {
    const recs = await getRecipes();
    const ings = await getIngredients();
    const prods = await getProducts();
    setRecipes(recs);
    setIngredients(ings);
    setProducts(prods);
  };

  const loadLogs = async (dateStr: string) => {
    const dayLogs = await getDayLog(dateStr);
    setLogs(dayLogs);
  };

  const loadLoggedDates = async () => {
    const allLogs = await getAllDayLogs();
    setLoggedDates(allLogs.map((entry) => entry.date));
  };

  const loadDailyTargets = async () => {
    const targets = await getDailyTargets();
    setDailyTargets(targets);
  };

  // Date Formatting Helpers
  const formatDateString = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const parseLocalDate = (dateStr: string): Date => {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d);
  };

  const formatDisplayDate = (dateStr: string): string => {
    if (!dateStr) return "";
    const d = parseLocalDate(dateStr);
    const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 (${weekdays[d.getDay()]})`;
  };

  // Generate a wider, scrollable range of dates anchored to today so
  // the user can freely scroll and pick a date (not forced to center)
  const calendarDays = useMemo(() => {
    if (!selectedDate) return [];
    const today = new Date();
    const baseDate = today; // anchor the list to today
    const days = [];
    const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
    const range = 15; // show 31 days (15 before and 15 after)

    for (let i = -range; i <= range; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      const dateStr = formatDateString(d);
      days.push({
        dateStr,
        dayNum: d.getDate(),
        dayName: weekdays[d.getDay()],
        isToday: formatDateString(new Date()) === dateStr,
        hasLog: loggedDates.includes(dateStr),
      });
    }
    return days;
  }, [selectedDate, loggedDates]);

  // Log Operations
  const handleDateChange = async (dateStr: string) => {
    setSelectedDate(dateStr);
    setExpandedLogId(null);
    await loadLogs(dateStr);
  };

  const handleAddManualFood = async () => {
    if (!manualName.trim() || !manualCalories.trim()) {
      Alert.alert("入力エラー", "料理名とカロリーを入力してください。");
      return;
    }

    const kcal = parseInt(manualCalories, 10);
    if (isNaN(kcal) || kcal < 0) {
      Alert.alert("入力エラー", "カロリーには正しい数値を入力してください。");
      return;
    }

    const protein = manualProtein.trim() ? parseFloat(manualProtein) : 0;
    const fat = manualFat.trim() ? parseFloat(manualFat) : 0;
    const carbs = manualCarbs.trim() ? parseFloat(manualCarbs) : 0;

    if (isNaN(protein) || isNaN(fat) || isNaN(carbs)) {
      Alert.alert("入力エラー", "PFCには正しい数値を入力してください。");
      return;
    }

    const newItem: LogItem = {
      id: `manual_${Date.now()}`,
      mealType: activeMealType,
      type: "manual",
      name: manualName,
      calories: kcal,
      protein: protein,
      fat: fat,
      carbs: carbs,
    };

    const updatedLogs = [...logs, newItem];
    setLogs(updatedLogs);
    await saveDayLog(selectedDate, updatedLogs);

    // Reset inputs
    setManualName("");
    setManualCalories("");
    setManualModalVisible(false);
  };

  const handleAddProductFood = async (product: Product) => {
    const newItem: LogItem = {
      id: `product_${Date.now()}`,
      mealType: activeMealType,
      type: "manual",
      name: product.name,
      calories: product.caloriesPerServing,
      protein: product.proteinPerServing || 0,
      fat: product.fatPerServing || 0,
      carbs: product.carbsPerServing || 0,
    };

    const updatedLogs = [...logs, newItem];
    setLogs(updatedLogs);
    await saveDayLog(selectedDate, updatedLogs);
    setProductModalVisible(false);
  };

  const handleOpenProductModal = async () => {
    // モーダルを開く前に最新のマスタデータを読み込む
    await loadMasterData();
    setProductModalVisible(true);
  };

  const handleOpenBarcodeScanner = () => {
    setActiveMealType(activeMealType);
    setBarcodeScannerVisible(true);
  };

  const handleBarcodeScanned = async (barcode: string) => {
    setBarcodeScannerVisible(false);
    
    // スキャンしたバーコードを商品名として使用
    setScannedProductName(barcode);
    
    // 既存の商品を検索
    const existingProduct = products.find(
      (p) => p.name.toLowerCase() === barcode.toLowerCase()
    );

    if (existingProduct) {
      // 既存商品が見つかった場合、直接追加
      await handleAddProductFood(existingProduct);
      setScannedProductName("");
    } else {
      // 新規商品の場合、市販品モーダルを開いて手動登録
      setProductModalVisible(true);
    }
  };

  const handleAddRecipeFood = async (recipe: Recipe) => {
    // Generate snapshot list of ingredients with their current master calorie values
    const logIngredients = recipe.ingredients.map((recIng) => {
      const matchedIng = ingredients.find((i) => i.id === recIng.ingredientId);
      return {
        ingredientId: recIng.ingredientId,
        name: matchedIng ? matchedIng.name : "不明な材料",
        amount: recIng.baseAmount,
        caloriesPer100g: matchedIng ? matchedIng.caloriesPer100g : 0,
        proteinPer100g: matchedIng ? matchedIng.proteinPer100g : 0,
        fatPer100g: matchedIng ? matchedIng.fatPer100g : 0,
        carbsPer100g: matchedIng ? matchedIng.carbsPer100g : 0,
      };
    });

    const newItem: LogItem = {
      id: `recipe_${Date.now()}`,
      mealType: activeMealType,
      type: "recipe",
      name: recipe.name,
      recipeId: recipe.id,
      ingredients: logIngredients,
      calories: 0, // calculated below
      protein: 0,
      fat: 0,
      carbs: 0,
    };

    newItem.calories = calculateItemCalories(newItem);
    const pfc = calculateItemPFC(newItem);
    newItem.protein = pfc.protein;
    newItem.fat = pfc.fat;
    newItem.carbs = pfc.carbs;

    const updatedLogs = [...logs, newItem];
    setLogs(updatedLogs);
    await saveDayLog(selectedDate, updatedLogs);
    setRecipeModalVisible(false);
  };

  const handleOpenRecipeModal = async () => {
    // モーダルを開く前に最新のマスタデータを読み込む
    await loadMasterData();
    setRecipeModalVisible(true);
  };

  const handleDeleteLogItem = async (itemId: string) => {
    const updatedLogs = logs.filter((item) => item.id !== itemId);
    setLogs(updatedLogs);
    await saveDayLog(selectedDate, updatedLogs);
    if (expandedLogId === itemId) {
      setExpandedLogId(null);
    }
  };

  const handleSaveTargets = async () => {
    await saveDailyTargets(dailyTargets);
    setSettingsModalVisible(false);
    Alert.alert("保存完了", "目標値を更新しました。");
  };

  // Adjust ingredient grams in-place with direct calories and PFC recalculation
  const handleUpdateIngredientWeight = async (
    logItemId: string,
    ingredientId: string,
    newWeight: number,
  ) => {
    const weight = Math.max(0, Math.round(newWeight));

    const updatedLogs = logs.map((log) => {
      // Only update the specific log item being adjusted
      if (log.id !== logItemId) return log;

      const updatedIngs = log.ingredients?.map((ing) => {
        if (ing.ingredientId !== ingredientId) return ing;
        return { ...ing, amount: weight };
      });

      const tempLog = { ...log, ingredients: updatedIngs };
      const updatedCalories = calculateItemCalories(tempLog);

      // Only recalculate PFC for recipe items (which have ingredients)
      // Manual items (including products) keep their original PFC values
      let updatedProtein = log.protein;
      let updatedFat = log.fat;
      let updatedCarbs = log.carbs;

      if (log.type === "recipe" && updatedIngs) {
        const updatedPFC = calculateItemPFC(tempLog);
        updatedProtein = updatedPFC.protein;
        updatedFat = updatedPFC.fat;
        updatedCarbs = updatedPFC.carbs;
      }

      return {
        ...tempLog,
        calories: updatedCalories,
        protein: updatedProtein,
        fat: updatedFat,
        carbs: updatedCarbs,
      };
    });

    setLogs(updatedLogs);
    await saveDayLog(selectedDate, updatedLogs);
  };

  // Delete ingredient from recipe log (day-specific)
  const handleDeleteIngredientFromLog = async (
    logItemId: string,
    ingredientId: string,
  ) => {
    Alert.alert("材料の削除", "この材料を削除しますか？", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: async () => {
          const updatedLogs = logs.map((log) => {
            if (log.id !== logItemId) return log;

            const updatedIngs = log.ingredients?.filter(
              (ing) => ing.ingredientId !== ingredientId,
            );

            const tempLog = { ...log, ingredients: updatedIngs };
            const updatedCalories = calculateItemCalories(tempLog);

            let updatedProtein = log.protein;
            let updatedFat = log.fat;
            let updatedCarbs = log.carbs;

            if (updatedIngs && updatedIngs.length > 0) {
              const updatedPFC = calculateItemPFC(tempLog);
              updatedProtein = updatedPFC.protein;
              updatedFat = updatedPFC.fat;
              updatedCarbs = updatedPFC.carbs;
            }

            return {
              ...tempLog,
              calories: updatedCalories,
              protein: updatedProtein,
              fat: updatedFat,
              carbs: updatedCarbs,
            };
          });

          setLogs(updatedLogs);
          await saveDayLog(selectedDate, updatedLogs);
        },
      },
    ]);
  };

  const handleAddIngredientToLog = async (logItemId: string) => {
    if (!selectedIngForRecipe || !recipeIngAmount.trim()) {
      Alert.alert("入力エラー", "材料と量を入力してください。");
      return;
    }

    const amount = parseInt(recipeIngAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("入力エラー", "正しいグラム数を入力してください。");
      return;
    }

    const matchedIng = ingredients.find((i) => i.id === selectedIngForRecipe);
    if (!matchedIng) {
      Alert.alert("エラー", "材料が見つかりません。");
      return;
    }

    const updatedLogs = logs.map((log) => {
      if (log.id !== logItemId) return log;

      // Check if ingredient already exists
      const existingIndex = log.ingredients?.findIndex(
        (ing) => ing.ingredientId === selectedIngForRecipe,
      );

      let updatedIngs;
      if (
        existingIndex !== undefined &&
        existingIndex >= 0 &&
        log.ingredients
      ) {
        // Update existing ingredient amount
        updatedIngs = [...log.ingredients];
        updatedIngs[existingIndex] = {
          ...updatedIngs[existingIndex],
          amount: amount,
        };
      } else {
        // Add new ingredient
        const newIng = {
          ingredientId: matchedIng.id,
          name: matchedIng.name,
          amount: amount,
          caloriesPer100g: matchedIng.caloriesPer100g,
          proteinPer100g: matchedIng.proteinPer100g,
          fatPer100g: matchedIng.fatPer100g,
          carbsPer100g: matchedIng.carbsPer100g,
        };
        updatedIngs = log.ingredients ? [...log.ingredients, newIng] : [newIng];
      }

      const tempLog = { ...log, ingredients: updatedIngs };
      const updatedCalories = calculateItemCalories(tempLog);
      const updatedPFC = calculateItemPFC(tempLog);

      return {
        ...tempLog,
        calories: updatedCalories,
        protein: updatedPFC.protein,
        fat: updatedPFC.fat,
        carbs: updatedPFC.carbs,
      };
    });

    setLogs(updatedLogs);
    await saveDayLog(selectedDate, updatedLogs);
    setShowAddIngToRecipe(null);
    setSelectedIngForRecipe("");
    setRecipeIngAmount("");
  };

  if (loading) {
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: colors.background, paddingTop: insets.top },
        ]}
      >
        <View style={styles.activityIndicator}>
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* ステータスバー下部から広告＋ヘッダーを重ならずに表示 */}
      <View style={{ paddingTop: insets.top }}>
        <BannerAdView />
        <View style={styles.headerInner}>
          <View style={styles.headerLeft}>
            <Text style={[styles.headerSubtitle, { color: colors.icon }]}>
              {formatDisplayDate(selectedDate)}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => setSettingsModalVisible(true)}
          >
            <Ionicons name="settings-outline" size={28} color={colors.icon} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 📅 Horizontal Date Carousel */}
      <DateCarousel
        selectedDate={selectedDate}
        calendarDays={calendarDays}
        onDateChange={handleDateChange}
        colors={colors}
        theme={theme as "light" | "dark"}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* 📊 Calories Progress Gauge */}
        <CaloriesProgress
          logs={logs}
          dailyTarget={dailyTargets.calories}
          proteinTarget={dailyTargets.protein}
          fatTarget={dailyTargets.fat}
          carbsTarget={dailyTargets.carbs}
          colors={colors}
        />

        {/* 🍳 Meal Sections */}
        {MEAL_TYPES.map((meal) => {
          const mealItems = logs.filter((item) => item.mealType === meal.key);
          const mealCal = mealCalories(logs);
          const mealSum = mealCal[meal.key as keyof typeof mealCal];

          return (
            <MealSection
              key={meal.key}
              meal={meal}
              mealItems={mealItems}
              mealSum={mealSum}
              expandedLogId={expandedLogId}
              showAddIngToRecipe={showAddIngToRecipe}
              selectedIngForRecipe={selectedIngForRecipe}
              recipeIngAmount={recipeIngAmount}
              ingredients={ingredients}
              colors={colors}
              onToggleExpand={setExpandedLogId}
              onDeleteLogItem={handleDeleteLogItem}
              onUpdateIngredientWeight={handleUpdateIngredientWeight}
              onDeleteIngredientFromLog={handleDeleteIngredientFromLog}
              onAddIngredientToLog={handleAddIngredientToLog}
              onShowAddIngToRecipe={setShowAddIngToRecipe}
              onSelectIngForRecipe={setSelectedIngForRecipe}
              onRecipeIngAmountChange={setRecipeIngAmount}
              onOpenManualModal={() => {
                setActiveMealType(meal.key);
                setManualModalVisible(true);
              }}
              onOpenRecipeModal={() => {
                setActiveMealType(meal.key);
                handleOpenRecipeModal();
              }}
              onOpenProductModal={() => {
                setActiveMealType(meal.key);
                handleOpenProductModal();
              }}
            />
          );
        })}
      </ScrollView>

      {/* ⚙️ Settings Modal */}
      <SettingsModal
        visible={settingsModalVisible}
        onClose={() => setSettingsModalVisible(false)}
        colors={colors}
        theme={theme as "light" | "dark"}
      />

      {/* 📝 Manual Add Modal */}
      <ManualAddModal
        visible={manualModalVisible}
        activeMealType={activeMealType}
        manualName={manualName}
        manualCalories={manualCalories}
        manualProtein={manualProtein}
        manualFat={manualFat}
        manualCarbs={manualCarbs}
        colors={colors}
        onClose={() => setManualModalVisible(false)}
        onNameChange={setManualName}
        onCaloriesChange={setManualCalories}
        onProteinChange={setManualProtein}
        onFatChange={setManualFat}
        onCarbsChange={setManualCarbs}
        onSubmit={handleAddManualFood}
      />

      {/* 🍛 Recipe Add Modal */}
      <RecipeAddModal
        visible={recipeModalVisible}
        activeMealType={activeMealType}
        recipes={recipes}
        ingredients={ingredients}
        recipeSearchQuery={recipeSearchQuery}
        colors={colors}
        onClose={() => setRecipeModalVisible(false)}
        onSearchChange={setRecipeSearchQuery}
        onSelectRecipe={handleAddRecipeFood}
      />

      {/* 🛒 Product Add Modal */}
      <Modal visible={productModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalContent,
              styles.productModalContent,
              { backgroundColor: "#fff" },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {MEAL_TYPES.find((m) => m.key === activeMealType)?.label} -
                市販品から選択
              </Text>
              <TouchableOpacity onPress={() => setProductModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.icon} />
              </TouchableOpacity>
            </View>
            <ProductSelector
              products={products}
              onSelect={handleAddProductFood}
              colors={colors}
              theme={theme as "light" | "dark"}
            />
          </View>
        </View>
      </Modal>

      {/* 📷 Barcode Scanner Modal */}
      <BarcodeScannerModal
        visible={barcodeScannerVisible}
        colors={colors}
        onClose={() => setBarcodeScannerVisible(false)}
        onBarcodeScanned={handleBarcodeScanned}
      />
    </View>
  );
}

// Product Selector Component (kept in index.tsx as it's only used here)
const ProductSelector = ({
  products,
  onSelect,
  colors,
  theme,
}: {
  products: Product[];
  onSelect: (product: Product) => void;
  colors: any;
  theme: string;
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.brand ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <View style={styles.productModalContent}>
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
            placeholder="商品名・ブランドで検索..."
            placeholderTextColor={colors.icon}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={16} color={colors.icon} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.productListContainer}
        showsVerticalScrollIndicator={false}
      >
        {filteredProducts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="storefront-outline" size={48} color="#D1D5DB" />
            <Text style={[styles.emptyTitle, { color: colors.icon }]}>
              {searchQuery
                ? "一致する商品が見つかりません"
                : "市販品が登録されていません"}
            </Text>
            <Text style={[styles.emptySubtitle, { color: "#9CA3AF" }]}>
              {searchQuery
                ? "検索ワードを変えてみてください"
                : "市販品管理タブから追加しましょう"}
            </Text>
          </View>
        ) : (
          filteredProducts.map((product) => (
            <TouchableOpacity
              key={product.id}
              style={[
                styles.productCard,
                { backgroundColor: "#fff", borderColor: "#E5E7EB" },
              ]}
              onPress={() => onSelect(product)}
            >
              <View style={styles.productInfo}>
                {product.brand ? (
                  <View style={styles.brandBadge}>
                    <Text style={styles.brandBadgeText}>{product.brand}</Text>
                  </View>
                ) : null}
                <Text
                  style={[styles.productName, { color: colors.text }]}
                  numberOfLines={2}
                >
                  {product.name}
                </Text>
                <Text style={[styles.productServing, { color: colors.icon }]}>
                  {product.servingSize} あたり
                </Text>
              </View>

              <View style={styles.productRight}>
                <Text style={[styles.productCalories, { color: colors.tint }]}>
                  {product.caloriesPerServing}
                </Text>
                <Text style={[styles.productCalUnit, { color: colors.icon }]}>
                  kcal
                </Text>
                <View
                  style={[
                    styles.productAddBtn,
                    { backgroundColor: colors.tint },
                  ]}
                >
                  <Text style={styles.productAddBtnText}>＋ 追加</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
};

// Calories calculation helper
const mealCalories = (logs: LogItem[]) => {
  const breakdown = { breakfast: 0, lunch: 0, dinner: 0, snack: 0 };
  logs.forEach((item) => {
    breakdown[item.mealType] += item.calories;
  });
  return breakdown;
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  activityIndicator: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  headerInner: {
    paddingHorizontal: 20,
    paddingBottom: 5,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flex: 1,
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
  settingsButton: {
    padding: 4,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    width: "100%",
  },
  productModalContent: {
    flex: 1,
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
  productListContainer: {
    paddingHorizontal: 24,
    gap: 10,
    paddingBottom: 20,
  },
  productCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  productInfo: {
    flex: 1,
    paddingRight: 12,
  },
  brandBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#F0FDF4",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 4,
  },
  brandBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#065F46",
  },
  productName: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 3,
  },
  productServing: {
    fontSize: 12,
  },
  productRight: {
    alignItems: "flex-end",
  },
  productCalories: {
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 26,
  },
  productCalUnit: {
    fontSize: 11,
    fontWeight: "500",
    marginBottom: 6,
  },
  productAddBtn: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  productAddBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 13,
  },
  barcodeScanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  barcodeScanButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
