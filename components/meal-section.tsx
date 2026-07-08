import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, ScrollView, TextInput } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LogItem, Ingredient } from '@/constants/storage';

type MealType = {
  key: string;
  label: string;
  icon: string;
  color: string;
};

type MealSectionProps = {
  meal: MealType;
  mealItems: LogItem[];
  mealSum: number;
  expandedLogId: string | null;
  showAddIngToRecipe: string | null;
  selectedIngForRecipe: string;
  recipeIngAmount: string;
  ingredients: Ingredient[];
  colors: any;
  onToggleExpand: (itemId: string) => void;
  onDeleteLogItem: (itemId: string) => void;
  onUpdateIngredientWeight: (logItemId: string, ingredientId: string, newWeight: number) => void;
  onDeleteIngredientFromLog: (logItemId: string, ingredientId: string) => void;
  onAddIngredientToLog: (logItemId: string) => void;
  onShowAddIngToRecipe: (itemId: string) => void;
  onSelectIngForRecipe: (ingId: string) => void;
  onRecipeIngAmountChange: (text: string) => void;
  onOpenManualModal: () => void;
  onOpenRecipeModal: () => void;
  onOpenProductModal: () => void;
  onCopyPrevious: () => void;
};

export default function MealSection({
  meal,
  mealItems,
  mealSum,
  expandedLogId,
  showAddIngToRecipe,
  selectedIngForRecipe,
  recipeIngAmount,
  ingredients,
  colors,
  onToggleExpand,
  onDeleteLogItem,
  onUpdateIngredientWeight,
  onDeleteIngredientFromLog,
  onAddIngredientToLog,
  onShowAddIngToRecipe,
  onSelectIngForRecipe,
  onRecipeIngAmountChange,
  onOpenManualModal,
  onOpenRecipeModal,
  onOpenProductModal,
  onCopyPrevious,
}: MealSectionProps) {
  return (
    <View style={[styles.mealSectionCard, { backgroundColor: '#ffffff', borderColor: '#e5e5ea' }]}>
      {/* Section Header */}
      <View style={styles.mealHeader}>
        <View style={styles.mealTitleRow}>
          <Ionicons name={meal.icon as any} size={20} color={meal.color} style={styles.mealIcon} />
          <Text style={[styles.mealTitleText, { color: colors.text }]}>{meal.label}</Text>
        </View>
        <View style={styles.mealHeaderRight}>
          <TouchableOpacity
            style={styles.copyPreviousBtn}
            onPress={onCopyPrevious}>
            <Ionicons name="copy-outline" size={13} color={colors.tint} />
            <Text style={[styles.copyPreviousText, { color: colors.tint }]}>前回のコピー</Text>
          </TouchableOpacity>
          <Text style={[styles.mealSumText, { color: colors.text }]}>{mealSum} kcal</Text>
        </View>
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
                      onToggleExpand(item.id);
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
                      onPress={() => onDeleteLogItem(item.id)}>
                      <Ionicons name="trash-outline" size={16} color="#ff453a" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>

                {/* Ingredient Editor for Recipes */}
                {item.type === 'recipe' && isExpanded && item.ingredients && (
                  <IngredientEditor
                    item={item}
                    showAddIngToRecipe={showAddIngToRecipe}
                    selectedIngForRecipe={selectedIngForRecipe}
                    recipeIngAmount={recipeIngAmount}
                    ingredients={ingredients}
                    colors={colors}
                    onUpdateIngredientWeight={onUpdateIngredientWeight}
                    onDeleteIngredientFromLog={onDeleteIngredientFromLog}
                    onAddIngredientToLog={onAddIngredientToLog}
                    onShowAddIngToRecipe={onShowAddIngToRecipe}
                    onSelectIngForRecipe={onSelectIngForRecipe}
                    onRecipeIngAmountChange={onRecipeIngAmountChange}
                  />
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
          onPress={onOpenManualModal}>
          <Ionicons name="create-outline" size={14} color={colors.tint} />
          <Text style={[styles.mealActionText, { color: colors.text }]}>手動追加</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.mealActionBtn,
            { backgroundColor: '#f2f2f7' },
          ]}
          onPress={onOpenRecipeModal}>
          <Ionicons name="list-outline" size={14} color={colors.tint} />
          <Text style={[styles.mealActionText, { color: colors.text }]}>レシピ追加</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.mealActionBtn,
            { backgroundColor: '#f2f2f7' },
          ]}
          onPress={onOpenProductModal}>
          <Ionicons name="storefront-outline" size={14} color={colors.tint} />
          <Text style={[styles.mealActionText, { color: colors.text }]}>市販品</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Ingredient Editor Component
function IngredientEditor({
  item,
  showAddIngToRecipe,
  selectedIngForRecipe,
  recipeIngAmount,
  ingredients,
  colors,
  onUpdateIngredientWeight,
  onDeleteIngredientFromLog,
  onAddIngredientToLog,
  onShowAddIngToRecipe,
  onSelectIngForRecipe,
  onRecipeIngAmountChange,
}: {
  item: LogItem;
  showAddIngToRecipe: string | null;
  selectedIngForRecipe: string;
  recipeIngAmount: string;
  ingredients: Ingredient[];
  colors: any;
  onUpdateIngredientWeight: (logItemId: string, ingredientId: string, newWeight: number) => void;
  onDeleteIngredientFromLog: (logItemId: string, ingredientId: string) => void;
  onAddIngredientToLog: (logItemId: string) => void;
  onShowAddIngToRecipe: (itemId: string) => void;
  onSelectIngForRecipe: (ingId: string) => void;
  onRecipeIngAmountChange: (text: string) => void;
}) {
  return (
    <View style={[styles.ingredientsContainer, { backgroundColor: '#F0FDF4' }]}>
      <View style={styles.ingredientsHeaderRow}>
        <Text style={[styles.ingredientsTitle, { color: colors.icon }]}>
          📊 材料の編集（その日限定）
        </Text>
        <TouchableOpacity
          style={[styles.addIngBtn, { backgroundColor: colors.tint }]}
          onPress={() => {
            onShowAddIngToRecipe(item.id);
          }}>
          <Ionicons name="add" size={14} color="#fff" />
          <Text style={styles.addIngBtnText}>材料追加</Text>
        </TouchableOpacity>
      </View>

      {/* Add Ingredient Form */}
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
                onPress={() => onSelectIngForRecipe(ing.id)}>
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
                onChangeText={onRecipeIngAmountChange}
              />
            </View>
            <View style={styles.addIngActionRow}>
              <TouchableOpacity
                style={[styles.addIngCancelBtn, { backgroundColor: '#e5e7eb' }]}
                onPress={() => onShowAddIngToRecipe('')}>
                <Text style={[styles.addIngBtnText, { color: colors.text }]}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.addIngConfirmBtn, { backgroundColor: colors.tint }]}
                onPress={() => onAddIngredientToLog(item.id)}>
                <Text style={[styles.addIngBtnText, { color: '#fff' }]}>追加</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Ingredient List */}
      {item.ingredients?.map((ing, index) => {
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
                  onPress={() => onDeleteIngredientFromLog(item.id, ing.ingredientId)}>
                  <Ionicons name="close-circle" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Bottom Row: Steppers & Input */}
            <View style={styles.ingBottomRow}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() =>
                  onUpdateIngredientWeight(item.id, ing.ingredientId, ing.amount - 10)
                }>
                <Text style={[styles.stepperBtnText, { color: colors.text }]}>-10g</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() =>
                  onUpdateIngredientWeight(item.id, ing.ingredientId, ing.amount - 1)
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
                    onUpdateIngredientWeight(
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
                  onUpdateIngredientWeight(item.id, ing.ingredientId, ing.amount + 1)
                }>
                <Text style={[styles.stepperBtnText, { color: colors.text }]}>+1g</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() =>
                  onUpdateIngredientWeight(item.id, ing.ingredientId, ing.amount + 10)
                }>
                <Text style={[styles.stepperBtnText, { color: colors.text }]}>+10g</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
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
  mealHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  copyPreviousBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#f2f2f7',
  },
  copyPreviousText: {
    fontSize: 11,
    fontWeight: '600',
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
  formInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 15,
  },
});