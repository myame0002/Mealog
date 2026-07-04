import {
  DailyTargets,
  DayLogSummary,
  getAllDayLogs,
  getDailyTargets,
} from "@/constants/storage";
import { Colors } from "@/constants/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MEAL_TYPES = [
  { key: "breakfast", label: "朝食", color: "#FF9500" },
  { key: "lunch", label: "昼食", color: "#34C759" },
  { key: "dinner", label: "夕食", color: "#5856D6" },
  { key: "snack", label: "間食・その他", color: "#AF52DE" },
] as const;

export default function CalendarScreen() {
  const colors = Colors["light"];
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<DayLogSummary[]>([]);
  const [, setTargets] = useState<DailyTargets>({
    calories: 2000,
    protein: 50,
    fat: 50,
    carbs: 250,
  });
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const resetToToday = () => {
    const today = getTodayString();
    setSelectedDate(today);
    setCurrentMonth(parseDateString(today));
  };

  useEffect(() => {
    const load = async () => {
      const [allLogs, dailyTargets] = await Promise.all([
        getAllDayLogs(),
        getDailyTargets(),
      ]);

      setLogs(allLogs);
      setTargets(dailyTargets);
      resetToToday();
      setLoading(false);
    };

    load();
  }, []);

  const logMap = useMemo(
    () => new Map(logs.map((entry) => [entry.date, entry])),
    [logs],
  );
  const selectedLog = selectedDate ? (logMap.get(selectedDate) ?? null) : null;

  const totals = useMemo(() => {
    const items = selectedLog?.items ?? [];
    return items.reduce(
      (acc, item) => {
        acc.calories += item.calories;
        acc.protein += item.protein;
        acc.fat += item.fat;
        acc.carbs += item.carbs;
        return acc;
      },
      { calories: 0, protein: 0, fat: 0, carbs: 0 },
    );
  }, [selectedLog]);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const firstWeekday = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const cells: { date: Date; isCurrentMonth: boolean; dateKey: string }[] =
      [];

    for (let i = firstWeekday - 1; i >= 0; i -= 1) {
      const date = new Date(year, month - 1, prevMonthDays - i);
      cells.push({
        date,
        isCurrentMonth: false,
        dateKey: formatDateString(date),
      });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month, day);
      cells.push({
        date,
        isCurrentMonth: true,
        dateKey: formatDateString(date),
      });
    }

    while (cells.length % 7 !== 0) {
      const nextDay = cells.length - daysInMonth - firstWeekday + 1;
      const date = new Date(year, month + 1, nextDay);
      cells.push({
        date,
        isCurrentMonth: false,
        dateKey: formatDateString(date),
      });
    }

    return cells;
  }, [currentMonth]);

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = parseDateString(dateStr);
    const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 (${weekdays[date.getDay()]})`;
  };

  const navigateMonth = (delta: number) => {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1),
    );
  };

  const handleSelectDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    setCurrentMonth(parseDateString(dateStr));
  };

  const renderMealGroup = (mealKey: (typeof MEAL_TYPES)[number]["key"]) => {
    const items = (selectedLog?.items ?? []).filter(
      (item) => item.mealType === mealKey,
    );
    if (items.length === 0) return null;

    const mealConfig = MEAL_TYPES.find((meal) => meal.key === mealKey)!;

    return (
      <View key={mealKey} style={styles.mealGroup}>
        <View style={styles.mealHeader}>
          <View style={styles.mealTitleRow}>
            <View
              style={[
                styles.mealTitleDot,
                { backgroundColor: mealConfig.color },
              ]}
            />
            <Text style={[styles.mealTitle, { color: colors.text }]}>
              {mealConfig.label}
            </Text>
          </View>
          <Text style={[styles.mealTotal, { color: colors.icon }]}>
            {items.reduce((sum, item) => sum + item.calories, 0)} kcal
          </Text>
        </View>

        {items.map((item) => (
          <View
            key={item.id}
            style={[styles.itemCard, { borderColor: "#E5E7EB" }]}
          >
            <View style={styles.itemInfo}>
              <Text style={[styles.itemName, { color: colors.text }]}>
                {item.name}
              </Text>
              <Text style={[styles.itemMeta, { color: colors.icon }]}>
                P {item.protein}g / F {item.fat}g / C {item.carbs}g
              </Text>
            </View>
            <Text style={[styles.itemCalories, { color: colors.tint }]}>
              {item.calories} kcal
            </Text>
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: colors.background, paddingTop: insets.top },
        ]}
      >
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            食事カレンダー
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.icon }]}>
            日付をタップすると、その日の記録が見られます
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.calendarCard,
            { backgroundColor: "#fff", borderColor: "#E5E7EB" },
          ]}
        >
          <View style={styles.monthHeader}>
            <TouchableOpacity onPress={() => navigateMonth(-1)}>
              <Ionicons name="chevron-back" size={22} color={colors.icon} />
            </TouchableOpacity>
            <Text style={[styles.monthTitle, { color: colors.text }]}>
              {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
            </Text>
            <TouchableOpacity onPress={() => navigateMonth(1)}>
              <Ionicons name="chevron-forward" size={22} color={colors.icon} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekdayRow}>
            {["日", "月", "火", "水", "木", "金", "土"].map((day) => (
              <Text key={day} style={styles.weekdayText}>
                {day}
              </Text>
            ))}
          </View>

          <View style={styles.grid}>
            {calendarDays.map((cell) => {
              const hasLog = Boolean(logMap.has(cell.dateKey));
              const isSelected = selectedDate === cell.dateKey;
              const isToday = cell.dateKey === getTodayString();
              return (
                <TouchableOpacity
                  key={cell.dateKey}
                  style={[
                    styles.dayCell,
                    !cell.isCurrentMonth && styles.dayCellMuted,
                    isSelected && styles.dayCellSelected,
                    !isSelected && isToday && styles.dayCellToday,
                    !isSelected && hasLog && styles.dayCellHasLog,
                  ]}
                  onPress={() => handleSelectDate(cell.dateKey)}
                >
                  <Text
                    style={[
                      styles.dayText,
                      !cell.isCurrentMonth && styles.dayTextMuted,
                      isSelected && { color: colors.tint },
                      !isSelected &&
                        isToday && { color: "#36c57e", fontWeight: "700" },
                      !isSelected && !isToday && hasLog && { color: "#B45309" },
                    ]}
                  >
                    {cell.date.getDate()}
                  </Text>
                  {hasLog ? <View style={styles.dayDot} /> : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {selectedLog ? (
          <>
            <View
              style={[
                styles.summaryCard,
                { backgroundColor: "#fff", borderColor: "#E5E7EB" },
              ]}
            >
              <Text style={[styles.summaryTitle, { color: colors.text }]}>
                {formatDisplayDate(selectedDate)}
              </Text>
              <View style={styles.summaryGrid}>
                <View style={styles.summaryBox}>
                  <Text style={styles.summaryLabel}>カロリー</Text>
                  <Text style={[styles.summaryValue, { color: colors.tint }]}>
                    {totals.calories} kcal
                  </Text>
                </View>
                <View style={styles.summaryBox}>
                  <Text style={styles.summaryLabel}>たんぱく質</Text>
                  <Text style={[styles.summaryValue, { color: "#34C759" }]}>
                    {totals.protein} g
                  </Text>
                </View>
                <View style={styles.summaryBox}>
                  <Text style={styles.summaryLabel}>脂質</Text>
                  <Text style={[styles.summaryValue, { color: "#AF52DE" }]}>
                    {totals.fat} g
                  </Text>
                </View>
                <View style={styles.summaryBox}>
                  <Text style={styles.summaryLabel}>炭水化物</Text>
                  <Text style={[styles.summaryValue, { color: "#FF9500" }]}>
                    {totals.carbs} g
                  </Text>
                </View>
              </View>
            </View>

            {MEAL_TYPES.map((meal) => renderMealGroup(meal.key))}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={40} color="#D1D5DB" />
            <Text style={[styles.emptyTitle, { color: colors.icon }]}>
              この日付には記録がありません
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const getTodayString = () => {
  const today = new Date();
  return formatDateString(today);
};

const parseDateString = (dateStr: string) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const formatDateString = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  headerTitle: { fontSize: 24, fontWeight: "700" },
  headerSubtitle: { fontSize: 13, marginTop: 4 },
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  calendarCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  monthHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  monthTitle: { fontSize: 16, fontWeight: "700" },
  weekdayRow: { flexDirection: "row", marginBottom: 6 },
  weekdayText: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  dayCell: {
    width: "14.2857%",
    aspectRatio: 1.05,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    backgroundColor: "#F9FAFB",
    paddingVertical: 10,
  },
  dayCellMuted: { opacity: 0.45 },
  dayCellToday: {
    backgroundColor: "#d9fce2",
  },
  dayCellSelected: { backgroundColor: "#E8F1FF" },
  dayCellHasLog: { backgroundColor: "#FFF7E6" },
  dayText: { fontSize: 14, color: "#111827", fontWeight: "600" },
  dayTextMuted: { color: "#9CA3AF" },
  dayTextSelected: { color: "#007AFF" },
  dayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FF9500",
    marginTop: 4,
  },
  summaryCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  summaryTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  summaryBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 10,
    minWidth: "47%",
    marginBottom: 8,
  },
  summaryLabel: { fontSize: 12, color: "#6B7280" },
  summaryValue: { fontSize: 16, fontWeight: "700", marginTop: 4 },
  targetRow: { marginTop: 10 },
  targetText: { fontSize: 12 },
  mealGroup: { marginBottom: 14 },
  mealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  mealTitleRow: { flexDirection: "row", alignItems: "center" },
  mealTitleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  mealTitle: { fontSize: 15, fontWeight: "700", marginLeft: 8 },
  mealTotal: { fontSize: 12 },
  itemCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    backgroundColor: "#fff",
  },
  itemInfo: { flex: 1, marginRight: 8 },
  itemName: { fontSize: 14, fontWeight: "600" },
  itemMeta: { fontSize: 12, marginTop: 2 },
  itemCalories: { fontSize: 13, fontWeight: "700" },
  emptyState: { paddingVertical: 24, alignItems: "center" },
  emptyTitle: { fontSize: 15, fontWeight: "600", marginTop: 10 },
  emptySubtitle: { fontSize: 13, marginTop: 4 },
});
