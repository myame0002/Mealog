// Open Food Facts API との連携

export interface OpenFoodFactsProduct {
  code: string;
  product_name?: string;
  brands?: string;
  image_url?: string;
  nutriments?: {
    [key: string]: number | undefined;
    energy_kcal_100g?: number;
    energy_kcal?: number;
    proteins_100g?: number;
    proteins?: number;
    fat_100g?: number;
    fat?: number;
    carbohydrates_100g?: number;
    carbohydrates?: number;
  };
  serving_size?: string;
  quantity?: string;
}

export interface ProductInfo {
  name: string;
  brand?: string;
  caloriesPerServing: number;
  servingSize: string;
  proteinPerServing: number | null;
  fatPerServing: number | null;
  carbsPerServing: number | null;
}

/**
 * Open Food Facts APIからバーコードで商品情報を取得
 */
export async function fetchProductByBarcode(barcode: string): Promise<ProductInfo | null> {
  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mealog - Calorie Tracker App - https://github.com/myame0002/Mealog',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    if (data.status !== 1 || !data.product) {
      return null;
    }

    const product: OpenFoodFactsProduct = data.product;

    // デバッグ用：商品情報をコンソールに出力
    console.log('Open Food Facts product data:', {
      name: product.product_name,
      brands: product.brands,
      nutriments: product.nutriments,
      serving_size: product.serving_size,
      quantity: product.quantity,
    });

    // 栄養情報を取得（100gあたりまたは1食あたり）
    const nutriments = product.nutriments || {};
    
    // カロリー (kcal) - 複数のフィールド名を試す
    const calories = nutriments['energy-kcal'] ?? nutriments['energy-kcal_100g'] ?? 
                     nutriments.energy_kcal ?? nutriments.energy_kcal_100g ?? 0;
    
    // タンパク質 (g) - 複数のフィールド名を試す
    const protein = nutriments.proteins ?? nutriments.proteins_100g ?? 
                    nutriments['proteins_100g'] ?? null;
    
    // 脂質 (g) - 複数のフィールド名を試す
    const fat = nutriments.fat ?? nutriments.fat_100g ?? 
                nutriments['fat_100g'] ?? null;
    
    // 炭水化物 (g) - 複数のフィールド名を試す
    const carbs = nutriments.carbohydrates ?? nutriments.carbohydrates_100g ?? 
                  nutriments['carbohydrates_100g'] ?? null;

    // 内容量を取得
    const servingSize = product.serving_size || product.quantity || '1食あたり';

    console.log('Parsed nutrition info:', {
      calories,
      protein,
      fat,
      carbs,
      servingSize,
    });
    
    // 利用可能なすべての栄養フィールドをログ出力（デバッグ用）
    console.log('All nutriments keys:', Object.keys(nutriments));

    return {
      name: product.product_name || barcode,
      brand: product.brands || undefined,
      caloriesPerServing: Math.round(calories),
      servingSize: servingSize,
      proteinPerServing: protein !== null ? Math.round(protein * 10) / 10 : null,
      fatPerServing: fat !== null ? Math.round(fat * 10) / 10 : null,
      carbsPerServing: carbs !== null ? Math.round(carbs * 10) / 10 : null,
    };
  } catch (error) {
    console.error('Open Food Facts API error:', error);
    return null;
  }
}

/**
 * バーコードから商品情報を検索（フォールバック付き）
 */
export async function searchProductByBarcode(barcode: string): Promise<ProductInfo | null> {
  // Open Food Factsから取得を試みる
  const product = await fetchProductByBarcode(barcode);
  
  if (product) {
    return product;
  }

  // 見つからない場合は、バーコードを商品名として返す（栄養成分はnull）
  return {
    name: barcode,
    caloriesPerServing: 0,
    servingSize: '1食あたり',
    proteinPerServing: null,
    fatPerServing: null,
    carbsPerServing: null,
  };
}
