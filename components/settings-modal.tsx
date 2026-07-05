import {
  DailyTargets,
  getDailyTargets,
  saveDailyTargets,
} from "@/constants/storage";
import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type SettingsModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave?: (targets: DailyTargets) => void;
  colors: any;
  theme: "light" | "dark";
};

export default function SettingsModal({
  visible,
  onClose,
  onSave,
  colors,
  theme,
}: SettingsModalProps) {
  const insets = useSafeAreaInsets();
  const [targets, setTargets] = useState<DailyTargets>({
    calories: 2000,
    protein: 50,
    fat: 50,
    carbs: 250,
  });
  const [inputValues, setInputValues] = useState({
    calories: String(2000),
    protein: String(50),
    fat: String(50),
    carbs: String(250),
  });

  // Load targets when modal opens
  useEffect(() => {
    if (visible) {
      loadTargets();
    }
  }, [visible]);

  const loadTargets = async () => {
    const loadedTargets = await getDailyTargets();
    setTargets(loadedTargets);
    setInputValues({
      calories: String(loadedTargets.calories),
      protein: String(loadedTargets.protein),
      fat: String(loadedTargets.fat),
      carbs: String(loadedTargets.carbs),
    });
  };

  const handleSave = async () => {
    const calories = parseInt(inputValues.calories, 10);
    const protein = parseInt(inputValues.protein, 10);
    const fat = parseInt(inputValues.fat, 10);
    const carbs = parseInt(inputValues.carbs, 10);
    const newTargets: DailyTargets = {
      calories: !isNaN(calories) && calories >= 0 ? calories : targets.calories,
      protein: !isNaN(protein) && protein >= 0 ? protein : targets.protein,
      fat: !isNaN(fat) && fat >= 0 ? fat : targets.fat,
      carbs: !isNaN(carbs) && carbs >= 0 ? carbs : targets.carbs,
    };
    await saveDailyTargets(newTargets);
    setTargets(newTargets);
    onSave?.(newTargets);
    onClose();
  };

  const updateInputValue = (field: keyof DailyTargets, value: string) => {
    if (/^\d*$/.test(value)) {
      setInputValues((prev) => ({ ...prev, [field]: value }));
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        style={[styles.backdrop, { backgroundColor: "rgba(0, 0, 0, 0.5)" }]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1, justifyContent: "flex-end" }}
          keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
        >
          <View
            style={[
              styles.container,
              {
                backgroundColor: colors.background,
                paddingTop: insets.top + 20,
                paddingBottom: insets.bottom + 20,
              },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>
                栄養素目標設定
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={28} color={colors.icon} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.description, { color: colors.icon }]}>
                1日の栄養素摂取目標を設定できます。
              </Text>

              {/* Calories Input */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Ionicons name="flame" size={20} color="#FF9500" />
                  <Text style={[styles.label, { color: colors.text }]}>
                    カロリー
                  </Text>
                </View>
                <View
                  style={[
                    styles.inputContainer,
                    { backgroundColor: "#F3F4F6", borderColor: "#E5E7EB" },
                  ]}
                >
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={inputValues.calories}
                    onChangeText={(text) => updateInputValue("calories", text)}
                    keyboardType="numeric"
                    placeholder="2000"
                    placeholderTextColor={colors.icon}
                  />
                  <Text style={[styles.unit, { color: colors.icon }]}>
                    kcal
                  </Text>
                </View>
              </View>

              {/* Protein Input */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Ionicons name="fitness" size={20} color="#34C759" />
                  <Text style={[styles.label, { color: colors.text }]}>
                    たんぱく質
                  </Text>
                </View>
                <View
                  style={[
                    styles.inputContainer,
                    { backgroundColor: "#F3F4F6", borderColor: "#E5E7EB" },
                  ]}
                >
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={inputValues.protein}
                    onChangeText={(text) => updateInputValue("protein", text)}
                    keyboardType="numeric"
                    placeholder="50"
                    placeholderTextColor={colors.icon}
                  />
                  <Text style={[styles.unit, { color: colors.icon }]}>g</Text>
                </View>
              </View>

              {/* Fat Input */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Ionicons name="water" size={20} color="#5856D6" />
                  <Text style={[styles.label, { color: colors.text }]}>
                    脂質
                  </Text>
                </View>
                <View
                  style={[
                    styles.inputContainer,
                    { backgroundColor: "#F3F4F6", borderColor: "#E5E7EB" },
                  ]}
                >
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={inputValues.fat}
                    onChangeText={(text) => updateInputValue("fat", text)}
                    keyboardType="numeric"
                    placeholder="50"
                    placeholderTextColor={colors.icon}
                  />
                  <Text style={[styles.unit, { color: colors.icon }]}>g</Text>
                </View>
              </View>

              {/* Carbs Input */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Ionicons name="nutrition" size={20} color="#AF52DE" />
                  <Text style={[styles.label, { color: colors.text }]}>
                    炭水化物
                  </Text>
                </View>
                <View
                  style={[
                    styles.inputContainer,
                    { backgroundColor: "#F3F4F6", borderColor: "#E5E7EB" },
                  ]}
                >
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={inputValues.carbs}
                    onChangeText={(text) => updateInputValue("carbs", text)}
                    keyboardType="numeric"
                    placeholder="250"
                    placeholderTextColor={colors.icon}
                  />
                  <Text style={[styles.unit, { color: colors.icon }]}>g</Text>
                </View>
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.tint }]}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>保存</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
  },
  description: {
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    padding: 0,
  },
  unit: {
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },
  saveButton: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
