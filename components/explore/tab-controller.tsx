import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Colors } from "@/constants/theme";

type TabType = "ingredients" | "recipes";

interface TabControllerProps {
  activeTab: TabType;
  recipesCount: number;
  ingredientsCount: number;
  onTabChange: (tab: TabType) => void;
}

export function TabController({
  activeTab,
  recipesCount,
  ingredientsCount,
  onTabChange,
}: TabControllerProps) {
  const colors = Colors["light"];

  return (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[
          styles.tabButton,
          activeTab === "recipes" && { backgroundColor: colors.tint },
          activeTab !== "recipes" && { backgroundColor: "#f0f0f0" },
        ]}
        onPress={() => onTabChange("recipes")}
      >
        <Text
          style={[
            styles.tabButtonText,
            { color: activeTab === "recipes" ? "#fff" : colors.text },
          ]}
        >
          レシピ ({recipesCount})
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tabButton,
          activeTab === "ingredients" && { backgroundColor: colors.tint },
          activeTab !== "ingredients" && { backgroundColor: "#f0f0f0" },
        ]}
        onPress={() => onTabChange("ingredients")}
      >
        <Text
          style={[
            styles.tabButtonText,
            { color: activeTab === "ingredients" ? "#fff" : colors.text },
          ]}
        >
          食材 ({ingredientsCount})
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: "bold",
  },
});

