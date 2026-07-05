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
  View,
} from "react-native";

const MEAL_TYPES = [
  { key: "breakfast", label: "朝食" },
  { key: "lunch", label: "昼食" },
  { key: "dinner", label: "夕食" },
  { key: "snack", label: "間食・その他" },
] as const;

type ManualAddModalProps = {
  visible: boolean;
  activeMealType: string;
  manualName: string;
  manualCalories: string;
  manualProtein: string;
  manualFat: string;
  manualCarbs: string;
  colors: any;
  onClose: () => void;
  onNameChange: (text: string) => void;
  onCaloriesChange: (text: string) => void;
  onProteinChange: (text: string) => void;
  onFatChange: (text: string) => void;
  onCarbsChange: (text: string) => void;
  onSubmit: () => void;
};

export default function ManualAddModal({
  visible,
  activeMealType,
  manualName,
  manualCalories,
  manualProtein,
  manualFat,
  manualCarbs,
  colors,
  onClose,
  onNameChange,
  onCaloriesChange,
  onProteinChange,
  onFatChange,
  onCarbsChange,
  onSubmit,
}: ManualAddModalProps) {
  const mealLabel =
    MEAL_TYPES.find((m) => m.key === activeMealType)?.label || "食事";

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
                {mealLabel} - 食事の手動入力
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={colors.icon} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalForm}>
              <Text style={[styles.formLabel, { color: colors.text }]}>
                料理名
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
                placeholder="例: サラダ、チキンソテー"
                placeholderTextColor={colors.icon}
                value={manualName}
                onChangeText={onNameChange}
              />

              <Text style={[styles.formLabel, { color: colors.text }]}>
                カロリー (kcal)
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
                placeholder="例: 350"
                placeholderTextColor={colors.icon}
                value={manualCalories}
                onChangeText={onCaloriesChange}
              />

              <Text style={[styles.formLabel, { color: colors.text }]}>
                たんぱく質 (g)
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
                placeholder="例: 25"
                placeholderTextColor={colors.icon}
                value={manualProtein}
                onChangeText={onProteinChange}
              />

              <Text style={[styles.formLabel, { color: colors.text }]}>
                脂質 (g)
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
                placeholder="例: 10"
                placeholderTextColor={colors.icon}
                value={manualFat}
                onChangeText={onFatChange}
              />

              <Text style={[styles.formLabel, { color: colors.text }]}>
                炭水化物 (g)
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
                placeholder="例: 40"
                placeholderTextColor={colors.icon}
                value={manualCarbs}
                onChangeText={onCarbsChange}
              />

              <TouchableOpacity
                style={[styles.formSubmitBtn, { backgroundColor: colors.tint }]}
                onPress={onSubmit}
              >
                <Text style={styles.formSubmitBtnText}>登録する</Text>
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
});
