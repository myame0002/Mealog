import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '@/constants/theme';
import {
  initStorage,
  getDayLog,
  saveDayLog,
  getRecipes,
  getIngredients,
  getProducts,
  LogItem,
  Recipe,
  Ingredient,
  Product,
  calculateItemCalories,
  calculateItemPFC,
} from '@/constants/storage';

const MEAL_TYPES = [
  { key: 'breakfast', label: '朝食', icon: 'sunny', color: '#FF9500' },
  { key: 'lunch', label: '昼食', icon: 'restaurant', color: '#34C759' },
  { key: 'dinner', label: '夕食', icon: 'moon', color: '#5856D6' },
  { key: 'snack', label: '間食・その他', icon: 'cafe', color: '#AF52DE' },
] as const;

export default function HomeScreen() {
  const theme = 'light';
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();

  // App States
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // UI Control States
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [recipeModalVisible, setRecipeModalVisible] = useState(false);
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [activeMealType, setActiveMealType] = useState<LogItem['mealType']>('breakfast');

  // Input states for Manual Modal
  const [manualName, setManualName] = useState('');
  const [manualCalories, setManualCalories] = useState('');
  const [manualProtein, setManualProtein] = useState('');
  const [manualFat, setManualFat] = useState('');
  const [manualCarbs, setManualCarbs] = useState('');

  // Search state for Recipe Modal
  const [recipeSearchQuery, setRecipeSearchQuery] = useState('');

  // Daily target calorie goal
  const dailyTarget = 2000;

  // Initialize storage and set today's date
  useEffect(() => {
    const startup = async () => {
      await initStorage();
      const today = new Date();
      const todayStr = formatDateString(today);
      setSelectedDate(todayStr);
      await loadMasterData();
      await loadLogs(todayStr);
      setLoading(false);
    };
    startup();
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

  // Date Formatting Helpers
  const formatDateString = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const parseLocalDate = (dateStr: string): Date => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const formatDisplayDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const d = parseLocalDate(dateStr);
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 (${weekdays[d.getDay()]})`;
  };

  // Generate 7 days centered around selected date for top selector
  const calendarDays = useMemo(() => {
    if (!selectedDate) return [];
    const baseDate = parseLocalDate(selectedDate);
    const days = [];
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];

    for (let i = -3; i <= 3; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      const dateStr = formatDateString(d);
      days.push({
        dateStr,
        dayNum: d.getDate(),
        dayName: weekdays[d.getDay()],
        isToday: formatDateString(new Date()) === dateStr,
      });
    }
    return days;
  }, [selectedDate]);

  // Calories Calculations
  const mealCalories = useMemo(() => {
    const breakdown = { breakfast: 0, lunch: 0, dinner: 0, snack: 0 };
    logs.forEach((item) => {
      breakdown[item.mealType] += item.calories;
    });
    return breakdown;
  }, [logs]);

  const totalCalories = useMemo(() => {
    return Object.values(mealCalories).reduce((sum, val) => sum + val, 0);
  }, [mealCalories]);

  // PFC Calculations
  const mealPFC = useMemo(() => {
    const breakdown = {
      breakfast: { protein: 0, fat: 0, carbs: 0 },
      lunch: { protein: 0, fat: 0, carbs: 0 },
      dinner: { protein: 0, fat: 0, carbs: 0 },
      snack: { protein: 0, fat: 0, carbs: 0 },
    };
    logs.forEach((item) => {
      breakdown[item.mealType].protein += item.protein;
      breakdown[item.mealType].fat += item.fat;
      breakdown[item.mealType].carbs += item.carbs;
    });
    return breakdown;
  }, [logs]);

  const totalPFC = useMemo(() => {
    return logs.reduce(
      (acc, item) => ({
        protein: acc.protein + item.protein,
        fat: acc.fat + item.fat,
        carbs: acc.carbs + item.carbs,
      }),
      { protein: 0, fat: 0, carbs: 0 }
    );
  }, [logs]);

  const progressPercentage = useMemo(() => {
    return Math.min((totalCalories / dailyTarget) * 100, 100);
  }, [totalCalories]);

  // Log Operations
  const handleDateChange = async (dateStr: string) => {
    setSelectedDate(dateStr);
    setExpandedLogId(null);
    await loadLogs(dateStr);
  };

  const handleAddManualFood = async () => {
    if (!manualName.trim() || !manualCalories.trim()) {
      Alert.alert('入力エラー', '料理名とカロリーを入力してください。');
      return;
    }

    const kcal = parseInt(manualCalories, 10);
    if (isNaN(kcal) || kcal < 0) {
      Alert.alert('入力エラー', 'カロリーには正しい数値を入力してください。');
      return;
    }

    const protein = manualProtein.trim() ? parseFloat(manualProtein) : 0;
    const fat = manualFat.trim() ? parseFloat(manualFat) : 0;
    const carbs = manualCarbs.trim() ? parseFloat(manualCarbs) : 0;

    if (isNaN(protein) || isNaN(fat) || isNaN(carbs)) {
      Alert.alert('入力エラー', 'PFCには正しい数値を入力してください。');
      return;
    }

    const newItem: LogItem = {
      id: `manual_${Date.now()}`,
      mealType: activeMealType,
      type: 'manual',
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
    setManualName('');
    setManualCalories('');
    setManualModalVisible(false);
  };

  const handleAddProductFood = async (product: Product) => {
    const newItem: LogItem = {
      id: `product_${Date.now()}`,
      mealType: activeMealType,
      type: 'manual',
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

  const handleAddRecipeFood = async (recipe: Recipe) => {
    // Generate snapshot list of ingredients with their current master calorie values
    const logIngredients = recipe.ingredients.map((recIng) => {
      const matchedIng = ingredients.find((i) => i.id === recIng.ingredientId);
      return {
        ingredientId: recIng.ingredientId,
        name: matchedIng ? matchedIng.name : '不明な材料',
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
      type: 'recipe',
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

  // Product Selector Component
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
    const [searchQuery, setSearchQuery] = useState('');

    const filteredProducts = products.filter((p) => {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        (p.brand ?? '').toLowerCase().includes(q)
      );
    });

    return (
      <View style={styles.productModalContent}>
        {/* Search Bar */}
        <View style={styles.modalSearchContainer}>
          <View style={[styles.searchBar, { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' }]}>
            <Ionicons name="search-outline" size={16} color={colors.icon} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="商品名・ブランドで検索..."
              placeholderTextColor={colors.icon}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color={colors.icon} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.productListContainer} showsVerticalScrollIndicator={false}>
          {filteredProducts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="storefront-outline" size={48} color="#D1D5DB" />
              <Text style={[styles.emptyTitle, { color: colors.icon }]}>
                {searchQuery ? '一致する商品が見つかりません' : '市販品が登録されていません'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: '#9CA3AF' }]}>
                {searchQuery ? '検索ワードを変えてみてください' : '市販品管理タブから追加しましょう'}
              </Text>
            </View>
          ) : (
            filteredProducts.map((product) => (
              <TouchableOpacity
                key={product.id}
                style={[styles.productCard, { backgroundColor: '#fff', borderColor: '#E5E7EB' }]}
                onPress={() => onSelect(product)}>
                <View style={styles.productInfo}>
                  {product.brand ? (
                    <View style={styles.brandBadge}>
                      <Text style={styles.brandBadgeText}>{product.brand}</Text>
                    </View>
                  ) : null}
                  <Text style={[styles.productName, { color: colors.text }]} numberOfLines={2}>
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
                  <Text style={[styles.productCalUnit, { color: colors.icon }]}>kcal</Text>
                  <View style={[styles.productAddBtn, { backgroundColor: colors.tint }]}>
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

  const handleDeleteLogItem = async (itemId: string) => {
    const updatedLogs = logs.filter((item) => item.id !== itemId);
    setLogs(updatedLogs);
    await saveDayLog(selectedDate, updatedLogs);
    if (expandedLogId === itemId) {
      setExpandedLogId(null);
    }
  };

  // Adjust ingredient grams in-place with direct calories and PFC recalculation
  const handleUpdateIngredientWeight = async (
    logItemId: string,
    ingredientId: string,
    newWeight: number
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
      
      if (log.type === 'recipe' && updatedIngs) {
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
    ingredientId: string
  ) => {
    Alert.alert('材料の削除', 'この材料を削除しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: async () => {
          const updatedLogs = logs.map((log) => {
            if (log.id !== logItemId) return log;

            const updatedIngs = log.ingredients?.filter(
              (ing) => ing.ingredientId !== ingredientId
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

  // Add ingredient to recipe log (day-specific)
  const [showAddIngToRecipe, setShowAddIngToRecipe] = useState<string | null>(null);
  const [selectedIngForRecipe, setSelectedIngForRecipe] = useState('');
  const [recipeIngAmount, setRecipeIngAmount] = useState('');

  const handleAddIngredientToLog = async (logItemId: string) => {
    if (!selectedIngForRecipe || !recipeIngAmount.trim()) {
      Alert.alert('入力エラー', '材料と量を入力してください。');
      return;
    }

    const amount = parseInt(recipeIngAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('入力エラー', '正しいグラム数を入力してください。');
      return;
    }

    const matchedIng = ingredients.find((i) => i.id === selectedIngForRecipe);
    if (!matchedIng) {
      Alert.alert('エラー', '材料が見つかりません。');
      return;
    }

    const updatedLogs = logs.map((log) => {
      if (log.id !== logItemId) return log;

      // Check if ingredient already exists
      const existingIndex = log.ingredients?.findIndex(
        (ing) => ing.ingredientId === selectedIngForRecipe
      );

      let updatedIngs;
      if (existingIndex !== undefined && existingIndex >= 0 && log.ingredients) {
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
    setSelectedIngForRecipe('');
    setRecipeIngAmount('');
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Mealog</Text>
        <Text style={[styles.headerSubtitle, { color: colors.icon }]}>
          {formatDisplayDate(selectedDate)}
        </Text>
      </View>

      {/* 📅 Horizontal Date Carousel */}
      <View style={styles.calendarContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.calendarScroll}>
          {calendarDays.map((day) => {
            const isSelected = day.dateStr === selectedDate;
            return (
              <TouchableOpacity
                key={day.dateStr}
                style={[
                  styles.calendarDayCard,
                  isSelected && { backgroundColor: colors.tint },
                  !isSelected && { backgroundColor: '#F3F4F6' },
                ]}
                onPress={() => handleDateChange(day.dateStr)}>
                <Text
                  style={[
                    styles.calendarDayName,
                    { color: isSelected ? '#fff' : colors.icon },
                  ]}>
                  {day.dayName}
                </Text>
                <Text
                  style={[
                    styles.calendarDayNum,
                    { color: isSelected ? '#fff' : colors.text },
                    day.isToday && !isSelected && { color: colors.tint, fontWeight: 'bold' },
                  ]}>
                  {day.dayNum}
                </Text>
                {day.isToday && <View style={[styles.todayIndicator, { backgroundColor: isSelected ? '#fff' : colors.tint }]} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* 📊 Calories Progress Gauge */}
        <View style={[styles.progressCard, { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }]}>
          <View style={styles.progressRow}>
            <View>
              <Text style={[styles.progressLabel, { color: colors.icon }]}>摂取カロリー</Text>
              <Text style={[styles.progressValue, { color: colors.text }]}>
                {totalCalories} <Text style={styles.progressUnit}>kcal</Text>
              </Text>
            </View>
            <View style={styles.alignRight}>
              <Text style={[styles.progressLabel, { color: colors.icon }]}>目標：{dailyTarget} kcal</Text>
              {totalCalories > dailyTarget ? (
                <Text style={[styles.overTargetText, { color: '#ff453a' }]}>
                  超過: {totalCalories - dailyTarget} kcal
                </Text>
              ) : (
                <Text style={[styles.underTargetText, { color: colors.tint }]}>
                  残り: {dailyTarget - totalCalories} kcal
                </Text>
              )}
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${progressPercentage}%`,
                  backgroundColor: totalCalories > dailyTarget ? '#ff453a' : colors.tint,
                },
              ]}
            />
          </View>

          {/* Quick breakdown list */}
          <View style={styles.breakdownRow}>
            {MEAL_TYPES.map((m) => (
              <View key={m.key} style={styles.breakdownCol}>
                <Ionicons name={m.icon} size={14} color={m.color} />
                <Text style={[styles.breakdownValue, { color: colors.text }]}>
                  {mealCalories[m.key]} <Text style={styles.breakdownUnit}>kcal</Text>
                </Text>
                <Text style={[styles.breakdownLabel, { color: colors.icon }]}>{m.label}</Text>
              </View>
            ))}
          </View>

          {/* PFC Breakdown */}
          <View style={styles.pfcBreakdownRow}>
            <View style={styles.pfcItem}>
              <Text style={[styles.pfcLabel, { color: colors.icon }]}>たんぱく質</Text>
              <Text style={[styles.pfcValue, { color: colors.text }]}>
                {Math.round(totalPFC.protein)}<Text style={styles.pfcUnit}>g</Text>
              </Text>
            </View>
            <View style={styles.pfcItem}>
              <Text style={[styles.pfcLabel, { color: colors.icon }]}>脂質</Text>
              <Text style={[styles.pfcValue, { color: colors.text }]}>
                {Math.round(totalPFC.fat)}<Text style={styles.pfcUnit}>g</Text>
              </Text>
            </View>
            <View style={styles.pfcItem}>
              <Text style={[styles.pfcLabel, { color: colors.icon }]}>炭水化物</Text>
              <Text style={[styles.pfcValue, { color: colors.text }]}>
                {Math.round(totalPFC.carbs)}<Text style={styles.pfcUnit}>g</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* 🍳 Meal Sections */}
        {MEAL_TYPES.map((meal) => {
          const mealItems = logs.filter((item) => item.mealType === meal.key);
          const mealSum = mealCalories[meal.key];

          const mealCardStyle = {
            backgroundColor: '#ffffff',
            borderColor: '#e5e5ea',
          } as const;

          return (
            <View
              key={meal.key}
              style={[
                styles.mealSectionCard,
                mealCardStyle,
              ]}>
              {/* Section Header */}
              <View style={styles.mealHeader}>
                <View style={styles.mealTitleRow}>
                  <Ionicons name={meal.icon} size={20} color={meal.color} style={styles.mealIcon} />
                  <Text style={[styles.mealTitleText, { color: colors.text }]}>{meal.label}</Text>
                </View>
                <Text style={[styles.mealSumText, { color: colors.text }]}>{mealSum} kcal</Text>
              </View>

              {/* Items List */}
              <View style={styles.mealItemsList}>
                {mealItems.length === 0 ? (
                  <Text style={[styles.emptySectionText, { color: colors.icon }]}>
                    食事が登録されていません
                  </Text>
                ) : (
                  mealItems.map((item) => {
                    const isExpanded = expandedLogId === item.id;
                    return (
                      <View
                        key={item.id}
                        style={[
                          styles.logItemContainer,
                          { borderBottomColor: '#f2f2f7' },
                        ]}>
                        {/* Food Row Tappable Header */}
                        <TouchableOpacity
                          activeOpacity={0.7}
                          style={styles.logItemHeader}
                          onPress={() => {
                            if (item.type === 'recipe') {
                              setExpandedLogId(isExpanded ? null : item.id);
                            }
                          }}>
                          <View style={styles.logItemNameCol}>
                            {item.type === 'recipe' && (
                              <Ionicons
                                name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                                size={14}
                                color={colors.icon}
                                style={styles.chevronIcon}
                              />
                            )}
                            <Text
                              style={[
                                styles.logItemName,
                                { color: colors.text },
                                item.type === 'recipe' && { fontWeight: '600' },
                              ]}
                              numberOfLines={1}
                              ellipsizeMode="tail">
                              {item.name}
                            </Text>
                            {item.type === 'recipe' && (
                              <View style={[styles.presetBadge, { backgroundColor: '#D1FAE5' }]}>
                                <Text style={[styles.presetBadgeText, { color: '#065F46' }]}>レシピ</Text>
                              </View>
                            )}
                          </View>
                          <View style={styles.logItemActionCol}>
                            <View>
                              <Text style={[styles.logItemCal, { color: colors.text }]}>
                                {item.calories} kcal
                              </Text>
                              {(item.protein > 0 || item.fat > 0 || item.carbs > 0) && (
                                <Text style={[styles.logItemPFC, { color: colors.icon }]}>
                                  P:{Math.round(item.protein)}g F:{Math.round(item.fat)}g C:{Math.round(item.carbs)}g
                                </Text>
                              )}
                            </View>
                            <TouchableOpacity
                              style={styles.deleteButton}
                              onPress={() => handleDeleteLogItem(item.id)}>
                              <Ionicons name="trash-outline" size={16} color="#ff453a" />
                            </TouchableOpacity>
                          </View>
                        </TouchableOpacity>

                        {/* ⚖️ Fine-Tuning Accordion for Recipes */}
                        {item.type === 'recipe' && isExpanded && item.ingredients && (
                          <View style={[styles.ingredientsContainer, { backgroundColor: '#F0FDF4' }]}>
                            <View style={styles.ingredientsHeaderRow}>
                              <Text style={[styles.ingredientsTitle, { color: colors.icon }]}>
                                📊 材料の編集（その日限定）
                              </Text>
                              <TouchableOpacity
                                style={[styles.addIngBtn, { backgroundColor: colors.tint }]}
                                onPress={() => {
                                  setShowAddIngToRecipe(item.id);
                                  setSelectedIngForRecipe('');
                                  setRecipeIngAmount('');
                                }}>
                                <Ionicons name="add" size={14} color="#fff" />
                                <Text style={styles.addIngBtnText}>材料追加</Text>
                              </TouchableOpacity>
                            </View>

                            {/* Add Ingredient Form (inline) */}
                            {showAddIngToRecipe === item.id && (
                              <View style={[styles.addIngForm, { backgroundColor: '#fff', borderColor: colors.tint }]}>
                                <Text style={[styles.addIngFormTitle, { color: colors.text }]}>
                                  新しい材料を追加
                                </Text>
                                <ScrollView style={styles.ingSelectorList} nestedScrollEnabled>
                                  {ingredients.map((ing) => (
                                    <TouchableOpacity
                                      key={ing.id}
                                      style={[
                                        styles.ingSelectorItem,
                                        selectedIngForRecipe === ing.id && { backgroundColor: colors.tint },
                                      ]}
                                      onPress={() => setSelectedIngForRecipe(ing.id)}>
                                      <Text
                                        style={{
                                          color: selectedIngForRecipe === ing.id ? '#fff' : colors.text,
                                          fontWeight: selectedIngForRecipe === ing.id ? 'bold' : 'normal',
                                        }}>
                                        {ing.name} ({ing.caloriesPer100g} kcal/100g)
                                      </Text>
                                    </TouchableOpacity>
                                  ))}
                                </ScrollView>
                                <View style={styles.addIngAmountRow}>
                                  <View style={{ flex: 1 }}>
                                    <Text style={[styles.tinyLabel, { color: colors.icon }]}>
                                      量 (g)
                                    </Text>
                                    <TextInput
                                      keyboardType="numeric"
                                      style={[styles.formInput, { color: colors.text }]}
                                      placeholder="例: 100"
                                      placeholderTextColor={colors.icon}
                                      value={recipeIngAmount}
                                      onChangeText={setRecipeIngAmount}
                                    />
                                  </View>
                                  <View style={styles.addIngActionRow}>
                                    <TouchableOpacity
                                      style={[styles.addIngCancelBtn, { backgroundColor: '#e5e7eb' }]}
                                      onPress={() => setShowAddIngToRecipe(null)}>
                                      <Text style={[styles.addIngBtnText, { color: colors.text }]}>キャンセル</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      style={[styles.addIngConfirmBtn, { backgroundColor: colors.tint }]}
                                      onPress={() => handleAddIngredientToLog(item.id)}>
                                      <Text style={[styles.addIngBtnText, { color: '#fff' }]}>追加</Text>
                                    </TouchableOpacity>
                                  </View>
                                </View>
                              </View>
                            )}

                            {item.ingredients.map((ing, index) => {
                              const calcKcal = Math.round((ing.amount * ing.caloriesPer100g) / 100);
                              return (
                                <View key={`${ing.ingredientId}-${index}`} style={styles.ingredientRow}>
                                  {/* Top Row: Name and Calories */}
                                  <View style={styles.ingTopRow}>
                                    <View style={{ flex: 1 }}>
                                      <Text style={[styles.ingName, { color: colors.text }]}>{ing.name}</Text>
                                      <Text style={[styles.ingKcalDetail, { color: colors.icon }]}>
                                        {ing.caloriesPer100g} kcal/100g
                                      </Text>
                                      <Text style={[styles.ingPfcDetail, { color: colors.icon }]}>
                                        P:{ing.proteinPer100g}g F:{ing.fatPer100g}g C:{ing.carbsPer100g}g
                                      </Text>
                                    </View>
                                    <View style={styles.ingSubTotalCol}>
                                      <Text style={[styles.ingSubTotalCal, { color: colors.text }]}>
                                        {calcKcal} kcal
                                      </Text>
                                      <Text style={[styles.ingSubTotalPFC, { color: colors.icon }]}>
                                        P:{Math.round((ing.amount * ing.proteinPer100g) / 100)}g
                                      </Text>
                                      <TouchableOpacity
                                        style={styles.ingDeleteBtn}
                                        onPress={() => handleDeleteIngredientFromLog(item.id, ing.ingredientId)}>
                                        <Ionicons name="close-circle" size={18} color="#EF4444" />
                                      </TouchableOpacity>
                                    </View>
                                  </View>

                                  {/* Bottom Row: Steppers & Input */}
                                  <View style={styles.ingBottomRow}>
                                    <TouchableOpacity
                                      style={styles.stepperBtn}
                                      onPress={() =>
                                        handleUpdateIngredientWeight(item.id, ing.ingredientId, ing.amount - 10)
                                      }>
                                      <Text style={[styles.stepperBtnText, { color: colors.text }]}>-10g</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      style={styles.stepperBtn}
                                      onPress={() =>
                                        handleUpdateIngredientWeight(item.id, ing.ingredientId, ing.amount - 1)
                                      }>
                                      <Text style={[styles.stepperBtnText, { color: colors.text }]}>-1g</Text>
                                    </TouchableOpacity>

                                    <View style={styles.weightInputBg}>
                                      <TextInput
                                        keyboardType="numeric"
                                        style={[styles.weightInput, { color: colors.text }]}
                                        value={String(ing.amount)}
                                        onChangeText={(txt) => {
                                          const parsed = parseInt(txt, 10);
                                          handleUpdateIngredientWeight(
                                            item.id,
                                            ing.ingredientId,
                                            isNaN(parsed) ? 0 : parsed
                                          );
                                        }}
                                      />
                                      <Text style={[styles.weightUnitText, { color: colors.icon }]}>g</Text>
                                    </View>

                                    <TouchableOpacity
                                      style={styles.stepperBtn}
                                      onPress={() =>
                                        handleUpdateIngredientWeight(item.id, ing.ingredientId, ing.amount + 1)
                                      }>
                                      <Text style={[styles.stepperBtnText, { color: colors.text }]}>+1g</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      style={styles.stepperBtn}
                                      onPress={() =>
                                        handleUpdateIngredientWeight(item.id, ing.ingredientId, ing.amount + 10)
                                      }>
                                      <Text style={[styles.stepperBtnText, { color: colors.text }]}>+10g</Text>
                                    </TouchableOpacity>
                                  </View>
                                </View>
                              );
                            })}
                          </View>
                        )}
                      </View>
                    );
                  })
                )}
              </View>

              {/* Action Buttons */}
              <View style={styles.mealActions}>
                <TouchableOpacity
                  style={[
                    styles.mealActionBtn,
                    { backgroundColor: '#f2f2f7' },
                  ]}
                  onPress={() => {
                    setActiveMealType(meal.key);
                    setManualModalVisible(true);
                  }}>
                  <Ionicons name="create-outline" size={14} color={colors.tint} />
                  <Text style={[styles.mealActionText, { color: colors.text }]}>手動追加</Text>
                </TouchableOpacity>

               <TouchableOpacity
                   style={[
                     styles.mealActionBtn,
                    { backgroundColor: '#f2f2f7' },
                   ]}
                   onPress={() => {
                     setActiveMealType(meal.key);
                     setRecipeModalVisible(true);
                   }}>
                   <Ionicons name="list-outline" size={14} color={colors.tint} />
                   <Text style={[styles.mealActionText, { color: colors.text }]}>レシピ追加</Text>
                 </TouchableOpacity>

                 <TouchableOpacity
                   style={[
                     styles.mealActionBtn,
                    { backgroundColor: '#f2f2f7' },
                   ]}
                   onPress={() => {
                     setActiveMealType(meal.key);
                     setProductModalVisible(true);
                   }}>
                   <Ionicons name="storefront-outline" size={14} color={colors.tint} />
                   <Text style={[styles.mealActionText, { color: colors.text }]}>市販品</Text>
                 </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* 📝 Manual Add Modal */}
      <Modal visible={manualModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboardContainer}>
            <View style={[styles.modalContent, { backgroundColor: '#fff' }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {MEAL_TYPES.find((m) => m.key === activeMealType)?.label} - 食事の手動入力
                </Text>
                <TouchableOpacity onPress={() => setManualModalVisible(false)}>
                  <Ionicons name="close" size={24} color={colors.icon} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalForm}>
                <Text style={[styles.formLabel, { color: colors.text }]}>料理名</Text>
                <TextInput
                    style={[
                      styles.formInput,
                      {
                        color: colors.text,
                        backgroundColor: '#f2f2f7',
                        borderColor: '#e5e5ea',
                      },
                    ]}
                  placeholder="例: サラダ、チキンソテー"
                  placeholderTextColor={colors.icon}
                  value={manualName}
                  onChangeText={setManualName}
                />

                <Text style={[styles.formLabel, { color: colors.text }]}>カロリー (kcal)</Text>
                <TextInput
                    style={[
                      styles.formInput,
                      {
                        color: colors.text,
                        backgroundColor: '#f2f2f7',
                        borderColor: '#e5e5ea',
                      },
                    ]}
                  keyboardType="numeric"
                  placeholder="例: 350"
                  placeholderTextColor={colors.icon}
                  value={manualCalories}
                  onChangeText={setManualCalories}
                />

                <Text style={[styles.formLabel, { color: colors.text }]}>たんぱく質 (g)</Text>
                <TextInput
                    style={[
                      styles.formInput,
                      {
                        color: colors.text,
                        backgroundColor: '#f2f2f7',
                        borderColor: '#e5e5ea',
                      },
                    ]}
                  keyboardType="numeric"
                  placeholder="例: 25"
                  placeholderTextColor={colors.icon}
                  value={manualProtein}
                  onChangeText={setManualProtein}
                />

                <Text style={[styles.formLabel, { color: colors.text }]}>脂質 (g)</Text>
                <TextInput
                    style={[
                      styles.formInput,
                      {
                        color: colors.text,
                        backgroundColor: '#f2f2f7',
                        borderColor: '#e5e5ea',
                      },
                    ]}
                  keyboardType="numeric"
                  placeholder="例: 10"
                  placeholderTextColor={colors.icon}
                  value={manualFat}
                  onChangeText={setManualFat}
                />

                <Text style={[styles.formLabel, { color: colors.text }]}>炭水化物 (g)</Text>
                <TextInput
                    style={[
                      styles.formInput,
                      {
                        color: colors.text,
                        backgroundColor: '#f2f2f7',
                        borderColor: '#e5e5ea',
                      },
                    ]}
                  keyboardType="numeric"
                  placeholder="例: 40"
                  placeholderTextColor={colors.icon}
                  value={manualCarbs}
                  onChangeText={setManualCarbs}
                />

                <TouchableOpacity
                  style={[styles.formSubmitBtn, { backgroundColor: colors.tint }]}
                  onPress={handleAddManualFood}>
                  <Text style={styles.formSubmitBtnText}>登録する</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* 🍛 Recipe Add Modal */}
      <Modal visible={recipeModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, styles.recipeModalContent, { backgroundColor: '#fff' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {MEAL_TYPES.find((m) => m.key === activeMealType)?.label} - レシピ一覧から選択
              </Text>
              <TouchableOpacity onPress={() => setRecipeModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.icon} />
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.modalSearchContainer}>
              <View style={[styles.searchBar, { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' }]}>
                <Ionicons name="search-outline" size={16} color={colors.icon} style={styles.searchIcon} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="レシピ名で検索..."
                  placeholderTextColor={colors.icon}
                  value={recipeSearchQuery}
                  onChangeText={setRecipeSearchQuery}
                />
                {recipeSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setRecipeSearchQuery('')}>
                    <Ionicons name="close-circle" size={16} color={colors.icon} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <ScrollView contentContainerStyle={styles.recipeListContainer} showsVerticalScrollIndicator={false}>
              {(() => {
                const filteredRecipes = recipes.filter((r) =>
                  r.name.toLowerCase().includes(recipeSearchQuery.toLowerCase())
                );

                if (filteredRecipes.length === 0) {
                  return (
                    <Text style={[styles.emptySectionText, { color: colors.icon, textAlign: 'center', padding: 20 }]}>
                      {recipeSearchQuery ? '一致するレシピが見つかりません' : 'レシピが登録されていません。レシピ管理タブから作成してください。'}
                    </Text>
                  );
                }

                return filteredRecipes.map((recipe) => {
                  // Calculate initial preset calories
                  const tempLogItem: Omit<LogItem, 'calories'> = {
                    id: 'temp',
                    mealType: 'breakfast',
                    type: 'recipe',
                    name: recipe.name,
                    protein: 0,
                    fat: 0,
                    carbs: 0,
                    ingredients: recipe.ingredients.map((ri) => {
                      const matched = ingredients.find((i) => i.id === ri.ingredientId);
                      return {
                        ingredientId: ri.ingredientId,
                        name: matched ? matched.name : '',
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
                            backgroundColor: '#f2f2f7',
                            borderColor: '#e5e5ea',
                          },
                      ]}
                      onPress={() => handleAddRecipeFood(recipe)}>
                      <View>
                        <Text style={[styles.recipeCardName, { color: colors.text }]}>{recipe.name}</Text>
                        <Text style={[styles.recipeCardIngs, { color: colors.icon }]}>
                          材料: {tempLogItem.ingredients?.map((i) => `${i.name}(${i.amount}g)`).join(', ')}
                        </Text>
                      </View>
                      <View style={styles.alignRight}>
                        <Text style={[styles.recipeCardKcal, { color: colors.tint }]}>{calVal} kcal</Text>
                        <Text style={[styles.recipeCardAddText, { color: colors.icon }]}>＋ 追加</Text>
                      </View>
                    </TouchableOpacity>
                  );
                });
              })()}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 🛒 Product Add Modal */}
      <Modal visible={productModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, styles.productModalContent, { backgroundColor: '#fff' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {MEAL_TYPES.find((m) => m.key === activeMealType)?.label} - 市販品から選択
              </Text>
              <TouchableOpacity onPress={() => setProductModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.icon} />
              </TouchableOpacity>
            </View>

            <ProductSelector products={products} onSelect={handleAddProductFood} colors={colors} theme={theme as 'light' | 'dark'} />
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 5,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  calendarContainer: {
    paddingVertical: 10,
  },
  calendarScroll: {
    paddingHorizontal: 15,
  },
  calendarDayCard: {
    width: 50,
    height: 70,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: 'transparent',
    position: 'relative',
  },
  calendarDayName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  calendarDayNum: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  todayIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    bottom: 6,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  progressCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  progressValue: {
    fontSize: 26,
    fontWeight: '800',
  },
  progressUnit: {
    fontSize: 14,
    fontWeight: '500',
  },
  overTargetText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  underTargetText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(120, 120, 128, 0.16)',
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(120, 120, 128, 0.2)',
    paddingTop: 14,
  },
  breakdownCol: {
    flex: 1,
    alignItems: 'center',
  },
  breakdownValue: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  breakdownUnit: {
    fontSize: 9,
    fontWeight: '500',
  },
  breakdownLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  pfcBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(120, 120, 128, 0.2)',
    paddingTop: 12,
    marginTop: 4,
  },
  pfcItem: {
    alignItems: 'center',
  },
  pfcLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginBottom: 2,
  },
  pfcValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  pfcUnit: {
    fontSize: 9,
    fontWeight: '500',
  },
  mealSectionCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 15,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 5,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealIcon: {
    marginRight: 8,
  },
  mealTitleText: {
    fontSize: 18,
    fontWeight: '700',
  },
  mealSumText: {
    fontSize: 16,
    fontWeight: '600',
  },
  mealItemsList: {
    marginBottom: 12,
  },
  emptySectionText: {
    fontSize: 13,
    textAlign: 'left',
    paddingVertical: 10,
    fontStyle: 'italic',
  },
  logItemContainer: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
  },
  logItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logItemNameCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },
  chevronIcon: {
    marginRight: 6,
  },
  logItemName: {
    fontSize: 15,
    fontWeight: '500',
    flexShrink: 1,
  },
  presetBadge: {
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    marginLeft: 6,
  },
  presetBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  logItemActionCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logItemCal: {
    fontSize: 15,
    fontWeight: '600',
    marginRight: 12,
  },
  deleteButton: {
    padding: 4,
  },
  logItemPFC: {
    fontSize: 9,
    fontWeight: '500',
    marginTop: 2,
  },
  ingredientsContainer: {
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
  },
  ingredientsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  ingredientsTitle: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  addIngBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  addIngBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  addIngForm: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  addIngFormTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  tinyLabel: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  ingSelectorList: {
    maxHeight: 120,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  ingSelectorItem: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f2f2f7',
  },
  addIngAmountRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  addIngActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  addIngCancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addIngConfirmBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  ingredientRow: {
    flexDirection: 'column',
    alignItems: 'stretch',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(120,120,128,0.1)',
  },
  ingTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ingBottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  ingName: {
    fontSize: 13,
    fontWeight: '500',
  },
  ingKcalDetail: {
    fontSize: 10,
    marginTop: 1,
  },
  ingPfcDetail: {
    fontSize: 9,
    marginTop: 1,
  },
  ingSubTotalCol: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 8,
  },
  ingSubTotalPFC: {
    fontSize: 9,
    marginTop: 1,
  },
  ingDeleteBtn: {
    padding: 2,
  },
  stepperBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
  },
  stepperBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  weightInputBg: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    height: 28,
    width: 66,
    justifyContent: 'center',
  },
  weightInput: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
    padding: 0,
  },
  weightUnitText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  ingSubTotalCal: {
    fontSize: 13,
    fontWeight: '600',
  },
  mealActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  mealActionBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  mealActionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  alignRight: {
    alignItems: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalKeyboardContainer: {
    width: '100%',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    width: '100%',
  },
  recipeModalContent: {
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalForm: {
    gap: 12,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
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
    alignItems: 'center',
    marginTop: 8,
  },
  formSubmitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  recipeListContainer: {
    gap: 10,
    paddingBottom: 20,
  },
  modalSearchContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
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
  productModalContent: {
    flex: 1,
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
    paddingRight: 12,
  },
  brandBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0FDF4',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 4,
  },
  brandBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#065F46',
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 3,
  },
  productServing: {
    fontSize: 12,
  },
  productRight: {
    alignItems: 'flex-end',
  },
  productCalories: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 26,
  },
  productCalUnit: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 6,
  },
  productAddBtn: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  productAddBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 13,
  },
  recipeCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recipeCardName: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  recipeCardIngs: {
    fontSize: 11,
    maxWidth: 220,
  },
  recipeCardKcal: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  recipeCardAddText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
});
