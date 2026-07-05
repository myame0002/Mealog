import React, { useState, useEffect } from 'react';
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
  getProducts,
  saveProduct,
  deleteProduct,
  Product,
} from '@/constants/storage';
import BarcodeScannerModal from '@/components/barcode-scanner-modal';

export default function ProductsScreen() {
  const theme = 'light';
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [barcodeScannerVisible, setBarcodeScannerVisible] = useState(false);

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formBrand, setFormBrand] = useState('');
  const [formCalories, setFormCalories] = useState('');
  const [formServing, setFormServing] = useState('');
  const [formProtein, setFormProtein] = useState('');
  const [formFat, setFormFat] = useState('');
  const [formCarbs, setFormCarbs] = useState('');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const prods = await getProducts();
    console.log('Loaded products:', prods.map(p => ({
      name: p.name,
      protein: p.proteinPerServing,
      fat: p.fatPerServing,
      carbs: p.carbsPerServing,
    })));
    setProducts(prods);
    setLoading(false);
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormName('');
    setFormBrand('');
    setFormCalories('');
    setFormServing('');
    setFormProtein('');
    setFormFat('');
    setFormCarbs('');
    setModalVisible(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingId(product.id);
    setFormName(product.name);
    setFormBrand(product.brand ?? '');
    setFormCalories(String(product.caloriesPerServing));
    setFormServing(product.servingSize);
    setFormProtein(product.proteinPerServing !== null ? String(product.proteinPerServing) : '');
    setFormFat(product.fatPerServing !== null ? String(product.fatPerServing) : '');
    setFormCarbs(product.carbsPerServing !== null ? String(product.carbsPerServing) : '');
    setModalVisible(true);
  };

  const calculateValue = (input: string): number => {
    const trimmed = input.trim();
    
    if (!trimmed) return 0;
    
    // 演算子が含まれている場合は計算式として評価
    if (/[+\-*/]/.test(trimmed)) {
      try {
        // 安全のため、数値、演算子（+-*/）、括弧、小数点のみ許可
        const sanitized = trimmed.replace(/[^0-9+\-*/().]/g, '');
        if (sanitized !== trimmed) {
          throw new Error('Invalid characters');
        }
        
        // Functionコンストラクタを使用（evalより安全）
        const result = new Function('return ' + sanitized)();
        
        if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
          return Math.round(result * 100) / 100; // 小数点2桁まで
        }
      } catch (error) {
        console.error('Calculation error:', error);
      }
      return 0;
    }
    
    // 演算子がない場合は直接数値としてパース
    const directNumber = parseFloat(trimmed);
    if (!isNaN(directNumber)) {
      return directNumber;
    }
    
    return 0;
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      Alert.alert('入力エラー', '商品名を入力してください。');
      return;
    }
    
    const cal = calculateValue(formCalories);
    if (cal < 0) {
      Alert.alert('入力エラー', 'カロリーに正しい数値または計算式を入力してください。');
      return;
    }
    
    if (!formServing.trim()) {
      Alert.alert('入力エラー', '内容量を入力してください。（例: 110g、1本）');
      return;
    }

    const protein = calculateValue(formProtein);
    const fat = calculateValue(formFat);
    const carbs = calculateValue(formCarbs);

    const product: Product = {
      id: editingId || `prod_${Date.now()}`,
      name: formName.trim(),
      brand: formBrand.trim() || undefined,
      caloriesPerServing: cal,
      servingSize: formServing.trim(),
      proteinPerServing: protein,
      fatPerServing: fat,
      carbsPerServing: carbs,
    };

    console.log('Saving product with PFC:', {
      name: product.name,
      protein: product.proteinPerServing,
      fat: product.fatPerServing,
      carbs: product.carbsPerServing,
    });

    try {
      const updated = await saveProduct(product);
      console.log('Product saved, updated list:', updated.map(p => ({
        name: p.name,
        protein: p.proteinPerServing,
        fat: p.fatPerServing,
        carbs: p.carbsPerServing,
      })));
      setProducts(updated);
      setModalVisible(false);
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('エラー', '保存に失敗しました。');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('市販品の削除', '本当にこの商品を削除しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: async () => {
          try {
            const updated = await deleteProduct(id);
            setProducts(updated);
          } catch {
            Alert.alert('エラー', '削除に失敗しました。');
          }
        },
      },
    ]);
  };

  // --- BARCODE SCANNER ---

  const handleOpenBarcodeScanner = () => {
    setBarcodeScannerVisible(true);
  };

  const handleBarcodeScanned = async (barcode: string) => {
    setBarcodeScannerVisible(false);
    
    // Open Food Factsから商品情報を取得
    Alert.alert('検索中', '商品情報を取得しています...');
    
    try {
      const { searchProductByBarcode } = await import('@/utils/openfoodfacts');
      const productInfo = await searchProductByBarcode(barcode);
      
      if (productInfo && productInfo.name !== barcode) {
        // 商品情報が取得できた場合、フォームに設定
        setEditingId(null);
        setFormName(productInfo.name);
        setFormBrand(productInfo.brand || '');
        setFormCalories(String(productInfo.caloriesPerServing));
        setFormProtein(String(productInfo.proteinPerServing));
        setFormFat(String(productInfo.fatPerServing));
        setFormCarbs(String(productInfo.carbsPerServing));
        setFormServing(productInfo.servingSize);
        
        // 注意書き付きのアラートを表示
        Alert.alert(
          '商品情報を取得しました',
          `商品名: ${productInfo.name}\nカロリー: ${productInfo.caloriesPerServing}kcal\n\n※ この情報はユーザー投稿型データベースのため、正確性は保証されていません。\n※ 表示されている栄養成分は1食分の値ではない場合があります。\n\n内容を確認して「OK」を押すと、登録画面が開きます。`,
          [{ text: 'OK', onPress: () => setModalVisible(true) }]
        );
      } else {
        // 商品情報が見つからなかった場合
        Alert.alert(
          '商品情報が見つかりませんでした',
          'このバーコードの商品情報は登録されていません。\n\n手動で商品を登録してください。',
          [
            { text: 'キャンセル', style: 'cancel' },
            {
              text: '手動で登録',
              onPress: () => {
                // バーコードを商品名にして手動登録モーダルを開く
                setEditingId(null);
                setFormName(barcode);
                setFormBrand('');
                setFormCalories('');
                setFormServing('');
                setFormProtein('');
                setFormFat('');
                setFormCarbs('');
                setModalVisible(true);
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      Alert.alert(
        'エラー',
        '商品情報の取得に失敗しました。\n\n手動で商品を登録してください。',
        [
          { text: 'キャンセル', style: 'cancel' },
          {
            text: '手動で登録',
            onPress: () => {
              // バーコードを商品名にして手動登録モーダルを開く
              setEditingId(null);
              setFormName(barcode);
              setFormBrand('');
              setFormCalories('');
              setFormServing('');
              setFormProtein('');
              setFormFat('');
              setFormCarbs('');
              setModalVisible(true);
            }
          }
        ]
      );
    }
  };

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.brand ?? '').toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>市販品マスタ</Text>
          <Text style={[styles.headerSubtitle, { color: colors.icon }]}>
            コンビニ・スーパーの商品カロリー帳
          </Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.addHeaderBtn, { backgroundColor: '#34C759' }]}
            onPress={handleOpenBarcodeScanner}>
            <Ionicons name="barcode-outline" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addHeaderBtn, { backgroundColor: colors.tint }]}
            onPress={handleOpenAdd}>
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
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

      {/* Products List */}
      <ScrollView
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}>
        {filteredProducts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="storefront-outline" size={48} color="#D1D5DB" />
            <Text style={[styles.emptyTitle, { color: colors.icon }]}>
              {searchQuery ? '一致する商品が見つかりません' : '市販品が登録されていません'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: '#9CA3AF' }]}>
              {searchQuery ? '検索ワードを変えてみてください' : '右上の＋ボタンから追加しましょう'}
            </Text>
          </View>
        ) : (
          filteredProducts.map((product) => (
            <View
              key={product.id}
              style={[styles.productCard, { backgroundColor: '#fff', borderColor: '#E5E7EB' }]}>
              <View style={styles.productInfo}>
                {/* Brand tag */}
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
                <Text style={[styles.productPFC, { color: colors.icon }]}>
                  P:{product.proteinPerServing !== null ? `${product.proteinPerServing}g` : '-'} F:{product.fatPerServing !== null ? `${product.fatPerServing}g` : '-'} C:{product.carbsPerServing !== null ? `${product.carbsPerServing}g` : '-'}
                </Text>
              </View>

              <View style={styles.productRight}>
                <Text style={[styles.productCalories, { color: colors.tint }]}>
                  {product.caloriesPerServing}
                </Text>
                <Text style={[styles.productCalUnit, { color: colors.icon }]}>kcal</Text>

                <View style={styles.productActions}>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => handleOpenEdit(product)}>
                    <Ionicons name="create-outline" size={18} color={colors.tint} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => handleDelete(product.id)}>
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 30 }} />
      </ScrollView>

      {/* 📷 Barcode Scanner Modal */}
      <BarcodeScannerModal
        visible={barcodeScannerVisible}
        colors={colors}
        onClose={() => setBarcodeScannerVisible(false)}
        onBarcodeScanned={handleBarcodeScanned}
      />

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboardContainer}>
            <View style={[styles.modalContent, { backgroundColor: '#fff' }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {editingId ? '市販品の編集' : '新しい市販品を登録'}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color={colors.icon} />
                </TouchableOpacity>
              </View>

              <View style={styles.form}>
                <Text style={[styles.formLabel, { color: colors.text }]}>商品名 *</Text>
                <TextInput
                  style={[styles.formInput, { color: colors.text }]}
                  placeholder="例: サラダチキン（プレーン）"
                  placeholderTextColor={colors.icon}
                  value={formName}
                  onChangeText={setFormName}
                />

                <Text style={[styles.formLabel, { color: colors.text }]}>
                  ブランド・メーカー（任意）
                </Text>
                <TextInput
                  style={[styles.formInput, { color: colors.text }]}
                  placeholder="例: ファミリーマート、SOYJOY"
                  placeholderTextColor={colors.icon}
                  value={formBrand}
                  onChangeText={setFormBrand}
                />

                 <View style={styles.formRow}>
                   <View style={styles.formHalf}>
                     <Text style={[styles.formLabel, { color: colors.text }]}>カロリー (kcal) *</Text>
                     <TextInput
                       style={[styles.formInput, { color: colors.text }]}
                       placeholder="例: 113 または 44*3.5"
                       placeholderTextColor={colors.icon}
                       value={formCalories}
                       onChangeText={setFormCalories}
                       autoCapitalize="none"
                       autoCorrect={false}
                     />
                   </View>
                   <View style={[styles.formHalf, { marginLeft: 10 }]}>
                     <Text style={[styles.formLabel, { color: colors.text }]}>内容量 *</Text>
                     <TextInput
                       style={[styles.formInput, { color: colors.text }]}
                       placeholder="例: 110g、1本"
                       placeholderTextColor={colors.icon}
                       value={formServing}
                       onChangeText={setFormServing}
                     />
                   </View>
                 </View>

                 <Text style={[styles.formLabel, { color: colors.text }]}>たんぱく質 (g/食)</Text>
                 <TextInput
                   style={[styles.formInput, { color: colors.text }]}
                   placeholder="例: 23 または 10*2.3"
                   placeholderTextColor={colors.icon}
                   value={formProtein}
                   onChangeText={setFormProtein}
                 />

                 <Text style={[styles.formLabel, { color: colors.text }]}>脂質 (g/食)</Text>
                 <TextInput
                   style={[styles.formInput, { color: colors.text }]}
                   placeholder="例: 1.1 または 0.5*2"
                   placeholderTextColor={colors.icon}
                   value={formFat}
                   onChangeText={setFormFat}
                 />

                 <Text style={[styles.formLabel, { color: colors.text }]}>炭水化物 (g/食)</Text>
                 <TextInput
                   style={[styles.formInput, { color: colors.text }]}
                   placeholder="例: 0 または 5*2"
                   placeholderTextColor={colors.icon}
                   value={formCarbs}
                   onChangeText={setFormCarbs}
                 />

                <TouchableOpacity
                  style={[styles.submitBtn, { backgroundColor: colors.tint }]}
                  onPress={handleSave}>
                  <Text style={styles.submitBtnText}>保存する</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
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
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  addHeaderBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
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
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 4,
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
  productCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: { elevation: 1 },
    }),
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
  productPFC: {
    fontSize: 10,
    marginTop: 2,
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
  productActions: {
    flexDirection: 'row',
    gap: 2,
  },
  iconBtn: {
    padding: 6,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalKeyboardContainer: {
    width: '100%',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
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
  form: {
    gap: 12,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    padding: 12,
    fontSize: 15,
  },
  formRow: {
    flexDirection: 'row',
  },
  formHalf: {
    flex: 1,
  },
  submitBtn: {
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
