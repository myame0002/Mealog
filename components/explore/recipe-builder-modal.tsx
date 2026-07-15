import { Ingredient, Recipe, RecipeIngredient, getUnit } from "@/constants/storage";
import { Colors } from "@/constants/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

interface RecipeBuilderModalProps {
  visible: boolean;
  editingRecipe: Recipe | null;
  recipeName: string;
  selectedIngredients: RecipeIngredient[];
  builderSelectedIngId: string;
  builderAmount: string;
  isSelectingIng: boolean;
  editingIngWeightId: string | null;
  tempIngWeight: string;
  ingredients: Ingredient[];
  onClose: () => void;
  onSave: () => void;
  onRecipeNameChange: (text: string) => void;
  onAddIngToRecipe: () => void;
  onRemoveIngFromRecipe: (ingId: string) => void;
  onUpdateIngWeight: (ingId: string, newWeight: number) => void;
  onStartEditWeight: (ingId: string, currentAmount: number) => void;
  onSaveWeightEdit: () => void;
  onSelectIngredient: (ingId: string) => void;
  onBuilderAmountChange: (text: string) => void;
  onCancelIngSelection: () => void;
  onStartIngSelection: () => void;
}

export function RecipeBuilderModal({
  visible,
  editingRecipe,
  recipeName,
  selectedIngredients,
  builderSelectedIngId,
  builderAmount,
  isSelectingIng,
  editingIngWeightId,
  tempIngWeight,
  ingredients,
  onClose,
  onSave,
  onRecipeNameChange,
  onAddIngToRecipe,
  onRemoveIngFromRecipe,
  onUpdateIngWeight,
  onStartEditWeight,
  onSaveWeightEdit,
  onSelectIngredient,
  onBuilderAmountChange,
  onCancelIngSelection,
  onStartIngSelection,
}: RecipeBuilderModalProps) {
  const colors = Colors["light"];
  const [ingredientSearchQuery, setIngredientSearchQuery] = useState("");

  const hasContent = recipeName.trim().length > 0 || selectedIngredients.length > 0;

  const handleClose = () => {
    if (hasContent) {
      Alert.alert(
        "レシピ編集を閉じる",
        "入力した内容は保存されません。閉じてもよろしいですか？",
        [
          { text: "キャンセル", style: "cancel" },
          { text: "閉じる", style: "destructive", onPress: onClose },
        ],
      );
    } else {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
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
              {editingRecipe ? "レシピの編集" : "新しいレシピを作成"}
            </Text>
            <TouchableOpacity onPress={handleClose}>
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
              value={recipeName}
              onChangeText={onRecipeNameChange}
            />

            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.formLabel, { color: colors.text }]}>
                配合する材料
              </Text>
              <TouchableOpacity
                style={[styles.smallAddBtn, { backgroundColor: colors.tint }]}
                onPress={onStartIngSelection}
              >
                <Ionicons name="add" size={14} color="#fff" />
                <Text style={styles.smallAddBtnText}>材料追加</Text>
              </TouchableOpacity>
            </View>

            {/* List of currently selected ingredients in the recipe builder */}
            <View
              style={[styles.builderIngsList, { backgroundColor: "#F0FDF4" }]}
            >
              {selectedIngredients.length === 0 ? (
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
                selectedIngredients.map((ri) => {
                  const ing = ingredients.find((i) => i.id === ri.ingredientId);
                  const unit = ing ? getUnit(ing) : "g";
                  const kcal = Math.round(
                    (ri.baseAmount * (ing?.caloriesPer100g || 0)) / (ing?.baseAmount ?? 100),
                  );
                  const isEditing = editingIngWeightId === ri.ingredientId;
                  return (
                    <View key={ri.ingredientId} style={styles.builderIngRow}>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.builderIngName,
                            { color: colors.text },
                          ]}
                        >
                          {ing ? ing.name : "不明"}
                        </Text>
                        {isEditing ? (
                          <View style={styles.inlineWeightEditRow}>
                            <TouchableOpacity
                              style={styles.inlineStepperBtn}
                              onPress={() =>
                                onUpdateIngWeight(
                                  ri.ingredientId,
                                  ri.baseAmount - 10,
                                )
                              }
                            >
                              <Text style={styles.inlineStepperText}>-10{unit}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.inlineStepperBtn}
                              onPress={() =>
                                onUpdateIngWeight(
                                  ri.ingredientId,
                                  ri.baseAmount - 1,
                                )
                              }
                            >
                              <Text style={styles.inlineStepperText}>-1{unit}</Text>
                            </TouchableOpacity>
                            <TextInput
                              keyboardType="numeric"
                              style={[
                                styles.inlineWeightInput,
                                { color: colors.text },
                              ]}
                              value={tempIngWeight}
                              onChangeText={onSaveWeightEdit}
                              onBlur={onSaveWeightEdit}
                            />
                            <Text
                              style={[
                                styles.inlineWeightUnit,
                                { color: colors.icon },
                              ]}
                            >
                              {unit}
                            </Text>
                            <TouchableOpacity
                              style={styles.inlineStepperBtn}
                              onPress={() =>
                                onUpdateIngWeight(
                                  ri.ingredientId,
                                  ri.baseAmount + 1,
                                )
                              }
                            >
                              <Text style={styles.inlineStepperText}>+1{unit}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.inlineStepperBtn}
                              onPress={() =>
                                onUpdateIngWeight(
                                  ri.ingredientId,
                                  ri.baseAmount + 10,
                                )
                              }
                            >
                              <Text style={styles.inlineStepperText}>+10{unit}</Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <Text
                            style={[
                              styles.builderIngCalText,
                              { color: colors.icon },
                            ]}
                          >
                            {ri.baseAmount}{unit} ({kcal} kcal)
                          </Text>
                        )}
                      </View>
                      <View style={styles.builderIngActions}>
                        {isEditing ? (
                          <TouchableOpacity
                            style={styles.saveWeightBtn}
                            onPress={onSaveWeightEdit}
                          >
                            <Ionicons name="checkmark" size={16} color="#fff" />
                          </TouchableOpacity>
                        ) : (
                          <>
                            <TouchableOpacity
                              style={styles.editWeightBtn}
                              onPress={() =>
                                onStartEditWeight(
                                  ri.ingredientId,
                                  ri.baseAmount,
                                )
                              }
                            >
                              <Ionicons
                                name="create-outline"
                                size={16}
                                color={colors.tint}
                              />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() =>
                                onRemoveIngFromRecipe(ri.ingredientId)
                              }
                            >
                              <Ionicons
                                name="close-circle-outline"
                                size={20}
                                color="#ff453a"
                              />
                            </TouchableOpacity>
                          </>
                        )}
                      </View>
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
                    <View style={styles.ingredientSearchBar}>
                      <Ionicons
                        name="search-outline"
                        size={14}
                        color={colors.icon}
                      />
                      <TextInput
                        style={[
                          styles.ingredientSearchInput,
                          { color: colors.text },
                        ]}
                        placeholder="食材を検索..."
                        placeholderTextColor={colors.icon}
                        value={ingredientSearchQuery}
                        onChangeText={setIngredientSearchQuery}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                      {ingredientSearchQuery.length > 0 && (
                        <TouchableOpacity
                          onPress={() => setIngredientSearchQuery("")}
                        >
                          <Ionicons
                            name="close-circle"
                            size={14}
                            color={colors.icon}
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                    <ScrollView
                      style={styles.miniScrollView}
                      nestedScrollEnabled={true}
                    >
                      {ingredients
                        .filter((ing) =>
                          ing.name
                            .toLowerCase()
                            .includes(ingredientSearchQuery.toLowerCase()),
                        )
                        .map((ing) => {
                          const isSelected = builderSelectedIngId === ing.id;
                          return (
                            <TouchableOpacity
                              key={ing.id}
                              style={[
                                styles.miniIngSelectRow,
                                isSelected && { backgroundColor: colors.tint },
                              ]}
                              onPress={() => onSelectIngredient(ing.id)}
                            >
                              <View>
                                <Text
                                  style={{
                                    fontSize: 12,
                                    color: isSelected ? "#fff" : colors.text,
                                    fontWeight: isSelected ? "bold" : "normal",
                                  }}
                                >
                                  {ing.name}
                                </Text>
                                {ing.servingSize && (
                                  <Text
                                    style={{
                                      fontSize: 10,
                                      color: isSelected
                                        ? "rgba(255,255,255,0.8)"
                                        : colors.icon,
                                      marginTop: 2,
                                    }}
                                  >
                                    目安: {ing.servingSize} ({ing.servingAmount}
                                    {getUnit(ing)})
                                  </Text>
                                )}
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                    </ScrollView>
                  </View>
                )}

                <View style={styles.builderQtyRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.tinyLabel, { color: colors.icon }]}>
                      基本量 (
                      {builderSelectedIngId
                        ? getUnit(
                            ingredients.find(
                              (i) => i.id === builderSelectedIngId,
                            ) ?? ({ baseUnit: "g" } as Ingredient),
                          )
                        : "g"}
                      )
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
                      onChangeText={onBuilderAmountChange}
                    />
                  </View>
                </View>

                <View style={styles.inlineActionRow}>
                  <TouchableOpacity
                    style={[
                      styles.inlineActionBtn,
                      { backgroundColor: "#e5e5ea" },
                    ]}
                    onPress={onCancelIngSelection}
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
                    onPress={onAddIngToRecipe}
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
              onPress={onSave}
            >
              <Text style={styles.formSubmitBtnText}>レシピを保存する</Text>
            </TouchableOpacity>
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
  builderIngActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  editWeightBtn: {
    padding: 4,
  },
  saveWeightBtn: {
    padding: 4,
    backgroundColor: Colors["light"].tint,
    borderRadius: 4,
  },
  inlineWeightEditRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  inlineStepperBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#e5e7eb",
  },
  inlineStepperText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  inlineWeightInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: "bold",
    width: 50,
    textAlign: "center",
  },
  inlineWeightUnit: {
    fontSize: 10,
    fontWeight: "bold",
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
  ingredientSearchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 8,
    gap: 6,
  },
  ingredientSearchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
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
