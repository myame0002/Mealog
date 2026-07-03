import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

type CalendarDay = {
  dateStr: string;
  dayNum: number;
  dayName: string;
  isToday: boolean;
};

type DateCarouselProps = {
  selectedDate: string;
  calendarDays: CalendarDay[];
  onDateChange: (dateStr: string) => void;
  colors: any;
  theme: 'light' | 'dark';
};

export default function DateCarousel({
  selectedDate,
  calendarDays,
  onDateChange,
  colors,
  theme,
}: DateCarouselProps) {
  return (
    <View style={styles.calendarContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.calendarScroll}>
        {calendarDays.map((day) => {
          const isSelected = day.dateStr === selectedDate;
          return (
            <TouchableOpacity
              key={day.dateStr}
              style={[
                styles.calendarDayCard,
                isSelected && { backgroundColor: colors.tint },
                !isSelected && { backgroundColor: '#F3F4F6' },
              ]}
              onPress={() => onDateChange(day.dateStr)}>
              <Text
                style={[
                  styles.calendarDayName,
                  { color: isSelected ? '#fff' : colors.icon },
                ]}>
                {day.dayName}
              </Text>
              <Text
                style={[
                  styles.calendarDayNum,
                  { color: isSelected ? '#fff' : colors.text },
                  day.isToday && !isSelected && { color: colors.tint, fontWeight: 'bold' },
                ]}>
                {day.dayNum}
              </Text>
              {day.isToday && <View style={[styles.todayIndicator, { backgroundColor: isSelected ? '#fff' : colors.tint }]} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  calendarContainer: {
    paddingVertical: 10,
  },
  calendarScroll: {
    paddingHorizontal: 15,
  },
  calendarDayCard: {
    width: 50,
    height: 70,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: 'transparent',
    position: 'relative',
  },
  calendarDayName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  calendarDayNum: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  todayIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    bottom: 6,
  },
});