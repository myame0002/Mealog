import AsyncStorage from "@react-native-async-storage/async-storage";

// --- DATA TYPES ---

export interface Ingredient {
  id: string;
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number; // たんぱく質 (g/100g)
  fatPer100g: number; // 脂質 (g/100g)
  carbsPer100g: number; // 炭水化物 (g/100g)
  servingSize?: string; // 例: "1本", "1個", "100g" (オプション)
  servingAmount?: number; // その分量のグラム数 (例: 150) (オプション)
}

export interface RecipeIngredient {
  ingredientId: string;
  baseAmount: number; // in grams
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: RecipeIngredient[];
}

export interface LoggedIngredient {
  ingredientId: string;
  name: string;
  amount: number; // in grams, editable!
  caloriesPer100g: number; // snapshot to prevent historical shifts if master changes
  proteinPer100g: number; // snapshot
  fatPer100g: number; // snapshot
  carbsPer100g: number; // snapshot
}

export interface LogItem {
  id: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  type: "manual" | "recipe";
  name: string;
  calories: number; // dynamic for recipe, static for manual
  protein: number; // たんぱく質 (g)
  fat: number; // 脂質 (g)
  carbs: number; // 炭水化物 (g)
  recipeId?: string;
  ingredients?: LoggedIngredient[];
}

export interface DayLog {
  date: string; // YYYY-MM-DD
  items: LogItem[];
}

// 市販品マスタ
export interface Product {
  id: string;
  name: string;
  brand?: string;
  caloriesPerServing: number;
  servingSize: string;
  proteinPerServing: number | null;
  fatPerServing: number | null;
  carbsPerServing: number | null;
}

// --- STORAGE KEYS ---
const KEYS = {
  INGREDIENTS: "mealog_master_ingredients",
  RECIPES: "mealog_master_recipes",
  PRODUCTS: "mealog_master_products",
  DAY_LOG_PREFIX: "mealog_day_",
  DAILY_TARGETS: "mealog_daily_targets",
};

// --- INITIAL SEED DATA ---
const SEED_PRODUCTS: Product[] = [];

const SEED_INGREDIENTS: Ingredient[] = [
  {
    id: "ing_1",
    name: "にんじん",
    caloriesPer100g: 35,
    proteinPer100g: 0.7,
    fatPer100g: 0.1,
    carbsPer100g: 8.7,
    servingSize: "1本(中)",
    servingAmount: 100,
  },
  {
    id: "ing_2",
    name: "じゃがいも",
    caloriesPer100g: 71,
    proteinPer100g: 1.5,
    fatPer100g: 0.1,
    carbsPer100g: 17.3,
    servingSize: "1個(中)",
    servingAmount: 150,
  },
  {
    id: "ing_3",
    name: "たまねぎ",
    caloriesPer100g: 33,
    proteinPer100g: 1.0,
    fatPer100g: 0.1,
    carbsPer100g: 8.4,
    servingSize: "1個(中)",
    servingAmount: 150,
  },
  {
    id: "ing_4",
    name: "卵",
    caloriesPer100g: 142,
    proteinPer100g: 12.2,
    fatPer100g: 10.2,
    carbsPer100g: 0.4,
    servingSize: "1個(中玉)",
    servingAmount: 50,
  },
  {
    id: "ing_5",
    name: "キャベツ",
    caloriesPer100g: 21,
    proteinPer100g: 1.3,
    fatPer100g: 0.1,
    carbsPer100g: 4.9,
    servingSize: "1/4個",
    servingAmount: 200,
  },
  {
    id: "ing_6",
    name: "白米",
    caloriesPer100g: 156,
    proteinPer100g: 2.5,
    fatPer100g: 0.3,
    carbsPer100g: 37.1,
    servingSize: "1膳",
    servingAmount: 150,
  },
  {
    id: "ing_7",
    name: "鶏もも肉",
    caloriesPer100g: 190,
    proteinPer100g: 16.6,
    fatPer100g: 14.2,
    carbsPer100g: 0.0,
    servingSize: "1枚",
    servingAmount: 200,
  },
  {
    id: "ing_8",
    name: "塩",
    caloriesPer100g: 0,
    proteinPer100g: 0.0,
    fatPer100g: 0.0,
    carbsPer100g: 0.0,
    servingSize: "小さじ1",
    servingAmount: 6,
  },
  {
    id: "ing_9",
    name: "こしょう",
    caloriesPer100g: 312,
    proteinPer100g: 11.1,
    fatPer100g: 4.9,
    carbsPer100g: 66.4,
    servingSize: "小さじ1",
    servingAmount: 2,
  },
  {
    id: "ing_10",
    name: "砂糖",
    caloriesPer100g: 391,
    proteinPer100g: 0.0,
    fatPer100g: 0.0,
    carbsPer100g: 99.3,
    servingSize: "大さじ1",
    servingAmount: 10,
  },
  {
    id: "ing_11",
    name: "ソース",
    caloriesPer100g: 125,
    proteinPer100g: 0.7,
    fatPer100g: 0.1,
    carbsPer100g: 30.1,
    servingSize: "大さじ1",
    servingAmount: 15,
  },
  {
    id: "ing_12",
    name: "ケチャップ",
    caloriesPer100g: 105,
    proteinPer100g: 1.7,
    fatPer100g: 0.2,
    carbsPer100g: 25.8,
    servingSize: "大さじ1",
    servingAmount: 15,
  },
  {
    id: "ing_13",
    name: "マヨネーズ",
    caloriesPer100g: 668,
    proteinPer100g: 1.3,
    fatPer100g: 72.3,
    carbsPer100g: 2.0,
    servingSize: "大さじ1",
    servingAmount: 15,
  },
  {
    id: "ing_14",
    name: "味の素",
    caloriesPer100g: 281,
    proteinPer100g: 45.8,
    fatPer100g: 0.0,
    carbsPer100g: 26.1,
    servingSize: "小さじ1",
    servingAmount: 3,
  },
  {
    id: "ing_15",
    name: "コンソメ(顆粒)",
    caloriesPer100g: 214,
    proteinPer100g: 9.0,
    fatPer100g: 1.2,
    carbsPer100g: 41.8,
    servingSize: "小さじ1",
    servingAmount: 3,
  },
  {
    id: "ing_16",
    name: "中華あじ",
    caloriesPer100g: 190,
    proteinPer100g: 11.0,
    fatPer100g: 0.6,
    carbsPer100g: 36.0,
    servingSize: "小さじ1",
    servingAmount: 3,
  },
  {
    id: "ing_17",
    name: "鶏がらスープの素",
    caloriesPer100g: 192,
    proteinPer100g: 8.9,
    fatPer100g: 1.0,
    carbsPer100g: 37.0,
    servingSize: "小さじ1",
    servingAmount: 3,
  },
  {
    id: "ing_18",
    name: "めんつゆ",
    caloriesPer100g: 121,
    proteinPer100g: 4.1,
    fatPer100g: 0.0,
    carbsPer100g: 23.3,
    servingSize: "大さじ1",
    servingAmount: 15,
  },
  {
    id: "ing_19",
    name: "白だし",
    caloriesPer100g: 53,
    proteinPer100g: 3.1,
    fatPer100g: 0.0,
    carbsPer100g: 8.5,
    servingSize: "大さじ1",
    servingAmount: 15,
  },
  {
    id: "ing_20",
    name: "醤油",
    caloriesPer100g: 77,
    proteinPer100g: 7.7,
    fatPer100g: 0.0,
    carbsPer100g: 10.1,
    servingSize: "大さじ1",
    servingAmount: 15,
  },
  {
    id: "ing_21",
    name: "みそ",
    caloriesPer100g: 182,
    proteinPer100g: 11.6,
    fatPer100g: 4.2,
    carbsPer100g: 24.3,
    servingSize: "大さじ1",
    servingAmount: 18,
  },
  {
    id: "ing_22",
    name: "オイスターソース",
    caloriesPer100g: 137,
    proteinPer100g: 5.3,
    fatPer100g: 0.1,
    carbsPer100g: 28.7,
    servingSize: "大さじ1",
    servingAmount: 15,
  },
  {
    id: "ing_23",
    name: "コチュジャン",
    caloriesPer100g: 246,
    proteinPer100g: 4.8,
    fatPer100g: 1.8,
    carbsPer100g: 52.8,
    servingSize: "大さじ1",
    servingAmount: 15,
  },
  {
    id: "ing_24",
    name: "テンメンジャン",
    caloriesPer100g: 255,
    proteinPer100g: 6.5,
    fatPer100g: 6.0,
    carbsPer100g: 43.8,
    servingSize: "大さじ1",
    servingAmount: 15,
  },
  {
    id: "ing_25",
    name: "トウバンジャン",
    caloriesPer100g: 49,
    proteinPer100g: 4.5,
    fatPer100g: 2.4,
    carbsPer100g: 5.4,
    servingSize: "小さじ1",
    servingAmount: 5,
  },
  {
    id: "ing_26",
    name: "一味唐辛子",
    caloriesPer100g: 413,
    proteinPer100g: 12.8,
    fatPer100g: 11.4,
    carbsPer100g: 64.3,
    servingSize: "小さじ1",
    servingAmount: 2,
  },
  {
    id: "ing_27",
    name: "辣油",
    caloriesPer100g: 853,
    proteinPer100g: 0.1,
    fatPer100g: 94.2,
    carbsPer100g: 3.5,
    servingSize: "小さじ1",
    servingAmount: 5,
  },
  {
    id: "ing_28",
    name: "きざみのり",
    caloriesPer100g: 354,
    proteinPer100g: 41.4,
    fatPer100g: 3.7,
    carbsPer100g: 43.4,
    servingSize: "1枚",
    servingAmount: 1,
  },
  {
    id: "ing_29",
    name: "唐辛子(輪切り)",
    caloriesPer100g: 413,
    proteinPer100g: 12.8,
    fatPer100g: 11.4,
    carbsPer100g: 64.3,
    servingSize: "小さじ1",
    servingAmount: 2,
  },
  {
    id: "ing_30",
    name: "いりごま",
    caloriesPer100g: 605,
    proteinPer100g: 20.3,
    fatPer100g: 54.2,
    carbsPer100g: 18.5,
    servingSize: "大さじ1",
    servingAmount: 10,
  },
  {
    id: "ing_31",
    name: "青さ粉",
    caloriesPer100g: 215,
    proteinPer100g: 19.1,
    fatPer100g: 1.0,
    carbsPer100g: 47.7,
    servingSize: "大さじ1",
    servingAmount: 2,
  },
  {
    id: "ing_32",
    name: "かつお節",
    caloriesPer100g: 351,
    proteinPer100g: 77.1,
    fatPer100g: 5.7,
    carbsPer100g: 0.8,
    servingSize: "大さじ1",
    servingAmount: 5,
  },
  {
    id: "ing_33",
    name: "天かす",
    caloriesPer100g: 607,
    proteinPer100g: 7.4,
    fatPer100g: 47.5,
    carbsPer100g: 37.6,
    servingSize: "大さじ1",
    servingAmount: 10,
  },
  {
    id: "ing_34",
    name: "サラダ油",
    caloriesPer100g: 884,
    proteinPer100g: 0.0,
    fatPer100g: 100.0,
    carbsPer100g: 0.0,
    servingSize: "大さじ1",
    servingAmount: 13,
  },
  {
    id: "ing_35",
    name: "オリーブオイル",
    caloriesPer100g: 884,
    proteinPer100g: 0.0,
    fatPer100g: 100.0,
    carbsPer100g: 0.0,
    servingSize: "大さじ1",
    servingAmount: 13,
  },
  {
    id: "ing_36",
    name: "ごま油",
    caloriesPer100g: 884,
    proteinPer100g: 0.0,
    fatPer100g: 100.0,
    carbsPer100g: 0.0,
    servingSize: "大さじ1",
    servingAmount: 13,
  },
  {
    id: "ing_37",
    name: "みりん",
    caloriesPer100g: 241,
    proteinPer100g: 0.3,
    fatPer100g: 0.0,
    carbsPer100g: 43.2,
    servingSize: "大さじ1",
    servingAmount: 15,
  },
];

const SEED_RECIPES: Recipe[] = [];

// --- HELPER FUNCTIONS ---

export const calculateItemCalories = (
  item: Omit<LogItem, "calories">,
): number => {
  if (item.type === "manual") {
    return 0; // manual should keep its pre-assigned calories
  }
  if (!item.ingredients) return 0;
  return Math.round(
    item.ingredients.reduce(
      (sum, ing) => sum + (ing.amount * ing.caloriesPer100g) / 100,
      0,
    ),
  );
};

export const calculateItemPFC = (
  item: Omit<LogItem, "calories" | "protein" | "fat" | "carbs">,
): { protein: number; fat: number; carbs: number } => {
  if (item.type === "manual") {
    return { protein: 0, fat: 0, carbs: 0 }; // manual items don't have PFC breakdown
  }
  if (!item.ingredients) return { protein: 0, fat: 0, carbs: 0 };

  const totals = item.ingredients.reduce(
    (acc, ing) => {
      const multiplier = ing.amount / 100;
      acc.protein += ing.proteinPer100g * multiplier;
      acc.fat += ing.fatPer100g * multiplier;
      acc.carbs += ing.carbsPer100g * multiplier;
      return acc;
    },
    { protein: 0, fat: 0, carbs: 0 },
  );

  return {
    protein: Math.round(totals.protein * 10) / 10,
    fat: Math.round(totals.fat * 10) / 10,
    carbs: Math.round(totals.carbs * 10) / 10,
  };
};

// --- API METHODS ---

export const initStorage = async (forceReset = false): Promise<void> => {
  try {
    const existingIngs = await AsyncStorage.getItem(KEYS.INGREDIENTS);
    const existingRecs = await AsyncStorage.getItem(KEYS.RECIPES);
    const existingProds = await AsyncStorage.getItem(KEYS.PRODUCTS);

    if (forceReset || !existingIngs) {
      await AsyncStorage.setItem(
        KEYS.INGREDIENTS,
        JSON.stringify(SEED_INGREDIENTS),
      );
    }
    if (forceReset || !existingRecs) {
      await AsyncStorage.setItem(KEYS.RECIPES, JSON.stringify(SEED_RECIPES));
    }
    if (forceReset || !existingProds) {
      await AsyncStorage.setItem(KEYS.PRODUCTS, JSON.stringify(SEED_PRODUCTS));
    }
  } catch (error) {
    console.error("Failed to initialize storage:", error);
  }
};

// --- INGREDIENTS MASTER API ---

export const getIngredients = async (): Promise<Ingredient[]> => {
  try {
    const data = await AsyncStorage.getItem(KEYS.INGREDIENTS);
    return data ? JSON.parse(data) : SEED_INGREDIENTS;
  } catch (error) {
    console.error("getIngredients error:", error);
    return SEED_INGREDIENTS;
  }
};

export const saveIngredient = async (
  ingredient: Ingredient,
): Promise<Ingredient[]> => {
  try {
    const list = await getIngredients();
    const index = list.findIndex((item) => item.id === ingredient.id);
    if (index >= 0) {
      list[index] = ingredient;
    } else {
      list.push(ingredient);
    }
    await AsyncStorage.setItem(KEYS.INGREDIENTS, JSON.stringify(list));
    return list;
  } catch (error) {
    console.error("saveIngredient error:", error);
    throw error;
  }
};

export const deleteIngredient = async (id: string): Promise<Ingredient[]> => {
  try {
    const list = await getIngredients();
    const filtered = list.filter((item) => item.id !== id);
    await AsyncStorage.setItem(KEYS.INGREDIENTS, JSON.stringify(filtered));
    return filtered;
  } catch (error) {
    console.error("deleteIngredient error:", error);
    throw error;
  }
};

// --- RECIPES MASTER API ---

export const getRecipes = async (): Promise<Recipe[]> => {
  try {
    const data = await AsyncStorage.getItem(KEYS.RECIPES);
    return data ? JSON.parse(data) : SEED_RECIPES;
  } catch (error) {
    console.error("getRecipes error:", error);
    return SEED_RECIPES;
  }
};

export const saveRecipe = async (recipe: Recipe): Promise<Recipe[]> => {
  try {
    const list = await getRecipes();
    const index = list.findIndex((item) => item.id === recipe.id);
    if (index >= 0) {
      list[index] = recipe;
    } else {
      list.push(recipe);
    }
    await AsyncStorage.setItem(KEYS.RECIPES, JSON.stringify(list));
    return list;
  } catch (error) {
    console.error("saveRecipe error:", error);
    throw error;
  }
};

export const deleteRecipe = async (id: string): Promise<Recipe[]> => {
  try {
    const list = await getRecipes();
    const filtered = list.filter((item) => item.id !== id);
    await AsyncStorage.setItem(KEYS.RECIPES, JSON.stringify(filtered));
    return filtered;
  } catch (error) {
    console.error("deleteRecipe error:", error);
    throw error;
  }
};

// --- PRODUCTS MASTER API ---

export const getProducts = async (): Promise<Product[]> => {
  try {
    const data = await AsyncStorage.getItem(KEYS.PRODUCTS);
    return data ? JSON.parse(data) : SEED_PRODUCTS;
  } catch (error) {
    console.error("getProducts error:", error);
    return SEED_PRODUCTS;
  }
};

export const saveProduct = async (product: Product): Promise<Product[]> => {
  try {
    const list = await getProducts();
    const index = list.findIndex((item) => item.id === product.id);
    if (index >= 0) {
      list[index] = product;
    } else {
      list.push(product);
    }
    await AsyncStorage.setItem(KEYS.PRODUCTS, JSON.stringify(list));
    return list;
  } catch (error) {
    console.error("saveProduct error:", error);
    throw error;
  }
};

export const deleteProduct = async (id: string): Promise<Product[]> => {
  try {
    const list = await getProducts();
    const filtered = list.filter((item) => item.id !== id);
    await AsyncStorage.setItem(KEYS.PRODUCTS, JSON.stringify(filtered));
    return filtered;
  } catch (error) {
    console.error("deleteProduct error:", error);
    throw error;
  }
};

// --- DAILY LOGS API ---

export interface DayLogSummary {
  date: string;
  items: LogItem[];
}

export const getDayLog = async (date: string): Promise<LogItem[]> => {
  try {
    const data = await AsyncStorage.getItem(`${KEYS.DAY_LOG_PREFIX}${date}`);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("getDayLog error:", error);
    return [];
  }
};

export const getAllDayLogs = async (): Promise<DayLogSummary[]> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const dayLogKeys = keys.filter((key) =>
      key.startsWith(KEYS.DAY_LOG_PREFIX),
    );
    const entries = await AsyncStorage.multiGet(dayLogKeys);

    return entries
      .map(([key, value]) => {
        if (!value) return null;
        const date = key.replace(KEYS.DAY_LOG_PREFIX, "");
        try {
          const items = JSON.parse(value) as LogItem[];
          if (items.length === 0) return null;
          return {
            date,
            items,
          };
        } catch {
          return null;
        }
      })
      .filter((entry): entry is DayLogSummary => Boolean(entry))
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error("getAllDayLogs error:", error);
    return [];
  }
};

export const saveDayLog = async (
  date: string,
  items: LogItem[],
): Promise<void> => {
  try {
    if (items.length === 0) {
      await AsyncStorage.removeItem(`${KEYS.DAY_LOG_PREFIX}${date}`);
      return;
    }

    await AsyncStorage.setItem(
      `${KEYS.DAY_LOG_PREFIX}${date}`,
      JSON.stringify(items),
    );
  } catch (error) {
    console.error("saveDayLog error:", error);
    throw error;
  }
};

// --- PREVIOUS MEAL LOGS API ---

/**
 * 指定された日付から1日ずつ遡り、指定された食事区分のログがある最初の日を探す
 */
export const getPreviousMealLogs = async (
  currentDate: string,
  mealType: LogItem["mealType"],
): Promise<{ date: string; items: LogItem[] } | null> => {
  try {
    const current = new Date(currentDate + "T00:00:00");
    // 最大30日前まで検索
    for (let i = 1; i <= 30; i++) {
      const prev = new Date(current);
      prev.setDate(prev.getDate() - i);
      const prevDateStr = prev.toISOString().split("T")[0];
      const dayLogs = await getDayLog(prevDateStr);
      const mealItems = dayLogs.filter((item) => item.mealType === mealType);
      if (mealItems.length > 0) {
        return { date: prevDateStr, items: mealItems };
      }
    }
    return null;
  } catch (error) {
    console.error("getPreviousMealLogs error:", error);
    return null;
  }
};

// --- DAILY TARGETS API ---

export interface DailyTargets {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export const getDailyTargets = async (): Promise<DailyTargets> => {
  try {
    const data = await AsyncStorage.getItem(KEYS.DAILY_TARGETS);
    if (data) {
      return JSON.parse(data);
    }
    // Default values
    return {
      calories: 2000,
      protein: 50,
      fat: 50,
      carbs: 250,
    };
  } catch (error) {
    console.error("getDailyTargets error:", error);
    return {
      calories: 2000,
      protein: 50,
      fat: 50,
      carbs: 250,
    };
  }
};

export const saveDailyTargets = async (
  targets: DailyTargets,
): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEYS.DAILY_TARGETS, JSON.stringify(targets));
  } catch (error) {
    console.error("saveDailyTargets error:", error);
    throw error;
  }
};
