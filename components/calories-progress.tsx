import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LogItem } from '@/constants/storage';

const MEAL_TYPES = [
  { key: 'breakfast', label: '朝食', icon: 'sunny', color: '#FF9500' },
  { key: 'lunch', label: '昼食', icon: 'restaurant', color: '#34C759' },
  { key: 'dinner', label: '夕食', icon: 'moon', color: '#5856D6' },
  { key: 'snack', label: '間食・その他', icon: 'cafe', color: '#AF52DE' },
] as const;

type CaloriesProgressProps = {
  logs: LogItem[];
  dailyTarget: number;
  proteinTarget: number;
  fatTarget: number;
  carbsTarget: number;
  colors: any;
};

export default function CaloriesProgress({ logs, dailyTarget, proteinTarget, fatTarget, carbsTarget, colors }: CaloriesProgressProps) {
  const mealCalories = useMemo(() => {
    const breakdown = { breakfast: 0, lunch: 0, dinner: 0, snack: 0 };
    logs.forEach((item) => {
      breakdown[item.mealType] += item.calories;
    });
    return breakdown;
  }, [logs]);

  const totalCalories = useMemo(() => {
    return Object.values(mealCalories).reduce((sum, val) => sum + val, 0);
  }, [mealCalories]);

  const totalPFC = useMemo(() => {
    return logs.reduce(
      (acc, item) => ({
        protein: acc.protein + item.protein,
        fat: acc.fat + item.fat,
        carbs: acc.carbs + item.carbs,
      }),
      { protein: 0, fat: 0, carbs: 0 }
    );
  }, [logs]);

  const progressPercentage = useMemo(() => {
    return Math.min((totalCalories / dailyTarget) * 100, 100);
  }, [totalCalories, dailyTarget]);

  return (
    <View style={[styles.progressCard, { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }]}>
      <View style={styles.progressRow}>
        <View>
          <Text style={[styles.progressLabel, { color: colors.icon }]}>摂取カロリー</Text>
          <Text style={[styles.progressValue, { color: colors.text }]}>
            {totalCalories} <Text style={styles.progressUnit}>kcal</Text>
          </Text>
        </View>
        <View style={styles.alignRight}>
          <Text style={[styles.progressLabel, { color: colors.icon }]}>目標：{dailyTarget} kcal</Text>
          {totalCalories > dailyTarget ? (
            <Text style={[styles.overTargetText, { color: '#ff453a' }]}>
              超過: {totalCalories - dailyTarget} kcal
            </Text>
          ) : (
            <Text style={[styles.underTargetText, { color: colors.tint }]}>
              残り: {dailyTarget - totalCalories} kcal
            </Text>
          )}
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarBg}>
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${progressPercentage}%`,
              backgroundColor: totalCalories > dailyTarget ? '#ff453a' : colors.tint,
            },
          ]}
        />
      </View>

      {/* Quick breakdown list */}
      <View style={styles.breakdownRow}>
        {MEAL_TYPES.map((m) => (
          <View key={m.key} style={styles.breakdownCol}>
            <Ionicons name={m.icon} size={14} color={m.color} />
            <Text style={[styles.breakdownValue, { color: colors.text }]}>
              {mealCalories[m.key]} <Text style={styles.breakdownUnit}>kcal</Text>
            </Text>
            <Text style={[styles.breakdownLabel, { color: colors.icon }]}>{m.label}</Text>
          </View>
        ))}
      </View>

      {/* PFC Breakdown with targets */}
      <View style={styles.pfcBreakdownRow}>
        <View style={styles.pfcItem}>
          <Text style={[styles.pfcLabel, { color: colors.icon }]}>たんぱく質</Text>
          <Text style={[styles.pfcValue, { color: totalPFC.protein > proteinTarget ? '#ff453a' : colors.text }]}>
            {Math.round(totalPFC.protein)}<Text style={styles.pfcUnit}>g</Text>
          </Text>
          <Text style={[styles.pfcTargetText, { color: totalPFC.protein > proteinTarget ? '#ff453a' : colors.icon }]}>
            / {proteinTarget}g
          </Text>
        </View>
        <View style={styles.pfcItem}>
          <Text style={[styles.pfcLabel, { color: colors.icon }]}>脂質</Text>
          <Text style={[styles.pfcValue, { color: totalPFC.fat > fatTarget ? '#ff453a' : colors.text }]}>
            {Math.round(totalPFC.fat)}<Text style={styles.pfcUnit}>g</Text>
          </Text>
          <Text style={[styles.pfcTargetText, { color: totalPFC.fat > fatTarget ? '#ff453a' : colors.icon }]}>
            / {fatTarget}g
          </Text>
        </View>
        <View style={styles.pfcItem}>
          <Text style={[styles.pfcLabel, { color: colors.icon }]}>炭水化物</Text>
          <Text style={[styles.pfcValue, { color: totalPFC.carbs > carbsTarget ? '#ff453a' : colors.text }]}>
            {Math.round(totalPFC.carbs)}<Text style={styles.pfcUnit}>g</Text>
          </Text>
          <Text style={[styles.pfcTargetText, { color: totalPFC.carbs > carbsTarget ? '#ff453a' : colors.icon }]}>
            / {carbsTarget}g
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  progressCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  progressValue: {
    fontSize: 26,
    fontWeight: '800',
  },
  progressUnit: {
    fontSize: 14,
    fontWeight: '500',
  },
  overTargetText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  underTargetText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  alignRight: {
    alignItems: 'flex-end',
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(120, 120, 128, 0.16)',
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(120, 120, 128, 0.2)',
    paddingTop: 14,
  },
  breakdownCol: {
    flex: 1,
    alignItems: 'center',
  },
  breakdownValue: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  breakdownUnit: {
    fontSize: 9,
    fontWeight: '500',
  },
  breakdownLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  pfcBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(120, 120, 128, 0.2)',
    paddingTop: 12,
    marginTop: 4,
  },
  pfcItem: {
    alignItems: 'center',
  },
  pfcLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginBottom: 2,
  },
  pfcValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  pfcUnit: {
    fontSize: 9,
    fontWeight: '500',
  },
  pfcTargetText: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
  },
});