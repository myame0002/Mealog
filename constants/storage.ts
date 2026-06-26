import AsyncStorage from '@react-native-async-storage/async-storage';

// --- DATA TYPES ---

export interface Ingredient {
  id: string;
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;      // たんぱく質 (g/100g)
  fatPer100g: number;          // 脂質 (g/100g)
  carbsPer100g: number;        // 炭水化物 (g/100g)
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
  amount: number;          // in grams, editable!
  caloriesPer100g: number; // snapshot to prevent historical shifts if master changes
  proteinPer100g: number;  // snapshot
  fatPer100g: number;      // snapshot
  carbsPer100g: number;    // snapshot
}

export interface LogItem {
  id: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  type: 'manual' | 'recipe';
  name: string;
  calories: number;        // dynamic for recipe, static for manual
  protein: number;         // たんぱく質 (g)
  fat: number;             // 脂質 (g)
  carbs: number;           // 炭水化物 (g)
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
  name: string;           // 商品名 e.g. "ファミマ サラダチキン"
  brand?: string;         // メーカー・ブランド e.g. "ファミリーマート"
  caloriesPerServing: number; // 1食あたりカロリー
  servingSize: string;    // 内容量 e.g. "110g" "1本" "1袋"
  proteinPerServing: number;  // たんぱく質 (g/食)
  fatPerServing: number;      // 脂質 (g/食)
  carbsPerServing: number;    // 炭水化物 (g/食)
}

// --- STORAGE KEYS ---
const KEYS = {
  INGREDIENTS: 'mealog_master_ingredients',
  RECIPES: 'mealog_master_recipes',
  PRODUCTS: 'mealog_master_products',
  DAY_LOG_PREFIX: 'mealog_day_',
};

// --- INITIAL SEED DATA ---
const SEED_PRODUCTS: Product[] = [
  { id: 'prod_1', name: 'サラダチキン (プレーン)', brand: 'ファミリーマート', caloriesPerServing: 113, servingSize: '110g', proteinPerServing: 23, fatPerServing: 1.1, carbsPerServing: 0 },
  { id: 'prod_2', name: 'ギリシャヨーグルト (無糖)', brand: 'オイコス', caloriesPerServing: 75, servingSize: '113g', proteinPerServing: 10, fatPerServing: 0.7, carbsPerServing: 4 },
  { id: 'prod_3', name: 'おにぎり (鮭)', brand: 'コンビニ各社', caloriesPerServing: 175, servingSize: '1個', proteinPerServing: 4.5, fatPerServing: 0.5, carbsPerServing: 36 },
  { id: 'prod_4', name: 'プロテインバー', brand: 'SOYJOY', caloriesPerServing: 142, servingSize: '1本', proteinPerServing: 8, fatPerServing: 6, carbsPerServing: 16 },
  { id: 'prod_5', name: 'バナナ', brand: '', caloriesPerServing: 86, servingSize: '1本(中)', proteinPerServing: 1.1, fatPerServing: 0.2, carbsPerServing: 21 },
];

const SEED_INGREDIENTS: Ingredient[] = [
  { id: 'ing_1', name: '鶏むね肉 (皮なし)', caloriesPer100g: 108, proteinPer100g: 23, fatPer100g: 1, carbsPer100g: 0 },
  { id: 'ing_2', name: '白米 (炊きあがり)', caloriesPer100g: 156, proteinPer100g: 2.5, fatPer100g: 0.3, carbsPer100g: 36 },
  { id: 'ing_3', name: '卵 (中玉)', caloriesPer100g: 142, proteinPer100g: 12, fatPer100g: 9.5, carbsPer100g: 0.5 },
  { id: 'ing_4', name: 'オリーブオイル', caloriesPer100g: 884, proteinPer100g: 0, fatPer100g: 100, carbsPer100g: 0 },
  { id: 'ing_5', name: '牛もも肉 (赤身)', caloriesPer100g: 182, proteinPer100g: 20, fatPer100g: 10, carbsPer100g: 0 },
  { id: 'ing_6', name: 'ブロッコリー', caloriesPer100g: 37, proteinPer100g: 4.5, fatPer100g: 0.5, carbsPer100g: 6 },
  { id: 'ing_7', name: '鮭 (生)', caloriesPer100g: 124, proteinPer100g: 22, fatPer100g: 4, carbsPer100g: 0 },
  { id: 'ing_8', name: 'アボカド', caloriesPer100g: 160, proteinPer100g: 2, fatPer100g: 15, carbsPer100g: 6 },
  { id: 'ing_9', name: '納豆', caloriesPer100g: 190, proteinPer100g: 16, fatPer100g: 9, carbsPer100g: 6 },
];

const SEED_RECIPES: Recipe[] = [
  {
    id: 'rec_1',
    name: '鶏むね肉とライス温野菜プレート',
    ingredients: [
      { ingredientId: 'ing_1', baseAmount: 150 }, // 鶏むね肉 150g
      { ingredientId: 'ing_2', baseAmount: 200 }, // 白米 200g
      { ingredientId: 'ing_6', baseAmount: 100 }, // ブロッコリー 100g
      { ingredientId: 'ing_4', baseAmount: 5 },   // オリーブオイル 5g
    ],
  },
  {
    id: 'rec_2',
    name: '卵かけご飯納豆添え',
    ingredients: [
      { ingredientId: 'ing_2', baseAmount: 150 }, // 白米 150g
      { ingredientId: 'ing_3', baseAmount: 50 },  // 卵 50g
      { ingredientId: 'ing_9', baseAmount: 50 },  // 納豆 50g
    ],
  },
  {
    id: 'rec_3',
    name: 'サーモンとアボカドのヘルシー丼',
    ingredients: [
      { ingredientId: 'ing_7', baseAmount: 120 }, // 鮭 120g
      { ingredientId: 'ing_8', baseAmount: 80 },  // アボカド 80g
      { ingredientId: 'ing_2', baseAmount: 150 }, // 白米 150g
    ],
  },
];

// --- HELPER FUNCTIONS ---

export const calculateItemCalories = (item: Omit<LogItem, 'calories'>): number => {
  if (item.type === 'manual') {
    return 0; // manual should keep its pre-assigned calories
  }
  if (!item.ingredients) return 0;
  return Math.round(
    item.ingredients.reduce(
      (sum, ing) => sum + (ing.amount * ing.caloriesPer100g) / 100,
      0
    )
  );
};

export const calculateItemPFC = (item: Omit<LogItem, 'calories' | 'protein' | 'fat' | 'carbs'>): { protein: number; fat: number; carbs: number } => {
  if (item.type === 'manual') {
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
    { protein: 0, fat: 0, carbs: 0 }
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
      await AsyncStorage.setItem(KEYS.INGREDIENTS, JSON.stringify(SEED_INGREDIENTS));
    }
    if (forceReset || !existingRecs) {
      await AsyncStorage.setItem(KEYS.RECIPES, JSON.stringify(SEED_RECIPES));
    }
    if (forceReset || !existingProds) {
      await AsyncStorage.setItem(KEYS.PRODUCTS, JSON.stringify(SEED_PRODUCTS));
    }
  } catch (error) {
    console.error('Failed to initialize storage:', error);
  }
};

// --- INGREDIENTS MASTER API ---

export const getIngredients = async (): Promise<Ingredient[]> => {
  try {
    const data = await AsyncStorage.getItem(KEYS.INGREDIENTS);
    return data ? JSON.parse(data) : SEED_INGREDIENTS;
  } catch (error) {
    console.error('getIngredients error:', error);
    return SEED_INGREDIENTS;
  }
};

export const saveIngredient = async (ingredient: Ingredient): Promise<Ingredient[]> => {
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
    console.error('saveIngredient error:', error);
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
    console.error('deleteIngredient error:', error);
    throw error;
  }
};

// --- RECIPES MASTER API ---

export const getRecipes = async (): Promise<Recipe[]> => {
  try {
    const data = await AsyncStorage.getItem(KEYS.RECIPES);
    return data ? JSON.parse(data) : SEED_RECIPES;
  } catch (error) {
    console.error('getRecipes error:', error);
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
    console.error('saveRecipe error:', error);
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
    console.error('deleteRecipe error:', error);
    throw error;
  }
};

// --- PRODUCTS MASTER API ---

export const getProducts = async (): Promise<Product[]> => {
  try {
    const data = await AsyncStorage.getItem(KEYS.PRODUCTS);
    return data ? JSON.parse(data) : SEED_PRODUCTS;
  } catch (error) {
    console.error('getProducts error:', error);
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
    console.error('saveProduct error:', error);
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
    console.error('deleteProduct error:', error);
    throw error;
  }
};

// --- DAILY LOGS API ---

export const getDayLog = async (date: string): Promise<LogItem[]> => {
  try {
    const data = await AsyncStorage.getItem(`${KEYS.DAY_LOG_PREFIX}${date}`);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('getDayLog error:', error);
    return [];
  }
};

export const saveDayLog = async (date: string, items: LogItem[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(`${KEYS.DAY_LOG_PREFIX}${date}`, JSON.stringify(items));
  } catch (error) {
    console.error('saveDayLog error:', error);
    throw error;
  }
};
