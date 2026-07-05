import { Ingredient } from "@/constants/storage";
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

interface IngredientModalProps {
  visible: boolean;
  editingIngredient: Ingredient | null;
  formData: {
    name: string;
    calories: string;
    protein: string;
    fat: string;
    carbs: string;
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
          <View style={[styles.modalContent, { backgroundColor: "#fff" }]}>
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
                value={formData.calories}
                onChangeText={(text) => onFormChange("calories", text)}
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
                value={formData.protein}
                onChangeText={(text) => onFormChange("protein", text)}
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
                value={formData.fat}
                onChangeText={(text) => onFormChange("fat", text)}
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
                value={formData.carbs}
                onChangeText={(text) => onFormChange("carbs", text)}
              />

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
                    placeholder="グラム数"
                    placeholderTextColor={colors.icon}
                    value={formData.servingAmount}
                    onChangeText={(text) => onFormChange("servingAmount", text)}
                  />
                </View>
              </View>
              <Text style={[styles.helperText, { color: colors.icon }]}>
                例: 1個(中玉) → 50g
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
});
