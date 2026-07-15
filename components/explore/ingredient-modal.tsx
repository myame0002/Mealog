import { Ingredient, Unit } from "@/constants/storage";
import { Colors } from "@/constants/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface IngredientModalProps {
  visible: boolean;
  editingIngredient: Ingredient | null;
  formData: {
    name: string;
    calories: string;
    protein: string;
    fat: string;
    carbs: string;
    baseAmount: string;
    baseUnit: Unit;
    servingSize: string;
    servingAmount: string;
  };
  onClose: () => void;
  onSave: () => void;
  onFormChange: (field: string, value: string) => void;
}

export function IngredientModal({
  visible,
  editingIngredient,
  formData,
  onClose,
  onSave,
  onFormChange,
}: IngredientModalProps) {
  const colors = Colors["light"];
  const insets = useSafeAreaInsets();
  const [showUnitPicker, setShowUnitPicker] = React.useState(false);

  const selectUnit = (unit: Unit) => {
    onFormChange("baseUnit", unit);
    setShowUnitPicker(false);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalKeyboardContainer}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: "#fff", paddingBottom: Math.max(insets.bottom, 40) },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingIngredient ? "食材マスタの編集" : "新しい食材の登録"}
              </Text>
              <TouchableOpacity onPress={onClose}>
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
                value={formData.name}
                onChangeText={(text) => onFormChange("name", text)}
              />

              {/* 基準量 + 単位 */}
              <View style={styles.baseUnitRow}>
                <TextInput
                  style={[
                    styles.formInput,
                    styles.baseAmountInput,
                    {
                      color: colors.text,
                      backgroundColor: "#f2f2f7",
                      borderColor: "#e5e5ea",
                    },
                  ]}
                  keyboardType="numeric"
                  placeholder="100"
                  placeholderTextColor={colors.icon}
                  value={formData.baseAmount}
                  onChangeText={(text) => onFormChange("baseAmount", text)}
                />
                <View style={styles.unitDropdownWrapper}>
                  <TouchableOpacity
                    style={[styles.unitDropdownToggle, { backgroundColor: "#f2f2f7", borderColor: "#e5e5ea" }]}
                    onPress={() => setShowUnitPicker(!showUnitPicker)}
                  >
                    <Text style={[styles.unitDropdownToggleText, { color: colors.text }]}>
                      {formData.baseUnit}
                    </Text>
                    <Ionicons
                      name={showUnitPicker ? "chevron-up" : "chevron-down"}
                      size={12}
                      color={colors.icon}
                    />
                  </TouchableOpacity>
                  {showUnitPicker && (
                    <View style={[styles.unitPickerMenu, { backgroundColor: "#fff", borderColor: "#e5e5ea" }]}>
                      <TouchableOpacity
                        style={[
                          styles.unitPickerOption,
                          formData.baseUnit === "g" && { backgroundColor: "#f2f2f7" },
                        ]}
                        onPress={() => selectUnit("g")}
                      >
                        <Text
                          style={[
                            styles.unitPickerOptionText,
                            { color: colors.text },
                            formData.baseUnit === "g" && { fontWeight: "bold", color: colors.tint },
                          ]}
                        >
                          g
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.unitPickerOption,
                          formData.baseUnit === "ml" && { backgroundColor: "#f2f2f7" },
                        ]}
                        onPress={() => selectUnit("ml")}
                      >
                        <Text
                          style={[
                            styles.unitPickerOptionText,
                            { color: colors.text },
                            formData.baseUnit === "ml" && { fontWeight: "bold", color: colors.tint },
                          ]}
                        >
                          ml
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>

              {/* カロリー + たんぱく質 */}
              <View style={styles.pairRow}>
                <View style={styles.pairField}>
                  <Text style={[styles.formLabel, { color: colors.text }]}>
                    カロリー (基準量あたり/kcal)
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
                    placeholder="例: 156 (100gあたりの場合)"
                    placeholderTextColor={colors.icon}
                    value={formData.calories}
                    onChangeText={(text) => onFormChange("calories", text)}
                  />
                </View>
                <View style={styles.pairField}>
                  <Text style={[styles.formLabel, { color: colors.text }]}>
                    たんぱく質 (基準量あたり/g)
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
                    placeholder="例: 2.5 (100gあたりの場合)"
                    placeholderTextColor={colors.icon}
                    value={formData.protein}
                    onChangeText={(text) => onFormChange("protein", text)}
                  />
                </View>
              </View>

              {/* 脂質 + 炭水化物 */}
              <View style={styles.pairRow}>
                <View style={styles.pairField}>
                  <Text style={[styles.formLabel, { color: colors.text }]}>
                    脂質 (基準量あたり/g)
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
                    placeholder="例: 0.3 (100gあたりの場合)"
                    placeholderTextColor={colors.icon}
                    value={formData.fat}
                    onChangeText={(text) => onFormChange("fat", text)}
                  />
                </View>
                <View style={styles.pairField}>
                  <Text style={[styles.formLabel, { color: colors.text }]}>
                    炭水化物 (基準量あたり/g)
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
                    placeholder="例: 37.1 (100gあたりの場合)"
                    placeholderTextColor={colors.icon}
                    value={formData.carbs}
                    onChangeText={(text) => onFormChange("carbs", text)}
                  />
                </View>
              </View>

              <Text style={[styles.formLabel, { color: colors.text }]}>
                目安分量 (任意)
              </Text>
              <View style={styles.servingRow}>
                <View style={{ flex: 2 }}>
                  <TextInput
                    style={[
                      styles.formInput,
                      {
                        color: colors.text,
                        backgroundColor: "#f2f2f7",
                        borderColor: "#e5e5ea",
                      },
                    ]}
                    placeholder="例: 1個, 1本, 大さじ1"
                    placeholderTextColor={colors.icon}
                    value={formData.servingSize}
                    onChangeText={(text) => onFormChange("servingSize", text)}
                  />
                </View>
                <View style={{ flex: 1 }}>
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
                    placeholder={formData.baseUnit === "ml" ? `${formData.baseUnit}` : "グラム数"}
                    placeholderTextColor={colors.icon}
                    value={formData.servingAmount}
                    onChangeText={(text) => onFormChange("servingAmount", text)}
                  />
                </View>
              </View>
              <Text style={[styles.helperText, { color: colors.icon }]}>
                例: 1個(中玉) → 50{formData.baseUnit}
              </Text>

              <TouchableOpacity
                style={[styles.formSubmitBtn, { backgroundColor: colors.tint }]}
                onPress={onSave}
              >
                <Text style={styles.formSubmitBtnText}>保存する</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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
  modalKeyboardContainer: {
    width: "100%",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    width: "100%",
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
    marginTop: 8,
  },
  formSubmitBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  servingRow: {
    flexDirection: "row",
    gap: 10,
  },
  helperText: {
    fontSize: 11,
    marginTop: 4,
  },
  baseUnitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  baseAmountInput: {
    width: 80,
  },
  unitDropdownWrapper: {
    position: "relative",
    zIndex: 100,
  },
  unitDropdownToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  unitDropdownToggleText: {
    fontSize: 15,
    fontWeight: "600",
  },
  unitPickerMenu: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    marginTop: 2,
    borderRadius: 10,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  unitPickerOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  unitPickerOptionText: {
    fontSize: 15,
    fontWeight: "500",
  },
  pairRow: {
    flexDirection: "row",
    gap: 10,
  },
  pairField: {
    flex: 1,
    gap: 6,
  },
});