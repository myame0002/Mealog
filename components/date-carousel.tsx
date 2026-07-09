import React, { useEffect, useRef } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type CalendarDay = {
  dateStr: string;
  dayNum: number;
  dayName: string;
  isToday: boolean;
  hasLog?: boolean;
};

type DateCarouselProps = {
  selectedDate: string;
  calendarDays: CalendarDay[];
  onDateChange: (dateStr: string) => void;
  colors: any;
  theme: "light" | "dark";
};

export default function DateCarousel({
  selectedDate,
  calendarDays,
  onDateChange,
  colors,
  theme,
}: DateCarouselProps) {
  const scrollRef = useRef<ScrollView | null>(null);
  const hasScrolledToToday = useRef(false);

  // On mount, position 'today' approximately at the 3rd slot from the left
  useEffect(() => {
    // Only scroll on initial mount
    if (hasScrolledToToday.current) return;
    
    // Find today's index in the provided days
    const todayIndex = calendarDays.findIndex((d) => d.isToday);
    if (todayIndex === -1 || !scrollRef.current) return;

    const itemWidth = 50; // must match styles.calendarDayCard.width
    const itemMargin = 5; // styles.calendarDayCard.marginHorizontal
    const itemSpacing = itemWidth + itemMargin * 2; // total space per item
    const desiredLeftSlot = 2; // zero-based third slot
    const contentPadding = 15; // styles.calendarScroll.paddingHorizontal

    const x = Math.max(
      0,
      itemSpacing * (todayIndex - desiredLeftSlot) - contentPadding,
    );
    
    hasScrolledToToday.current = true;
    // @ts-ignore - scrollTo exists on ScrollView ref
    scrollRef.current.scrollTo({ x, animated: true });
  }, [calendarDays]);
  const setScrollRef = (ref: ScrollView | null) => {
    scrollRef.current = ref;
  };

  return (
    <View style={styles.calendarContainer}>
      <ScrollView
        ref={setScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.calendarScroll}
      >
        {calendarDays.map((day) => {
          const isSelected = day.dateStr === selectedDate;
          return (
            <TouchableOpacity
              key={day.dateStr}
              style={[
                styles.calendarDayCard,
                isSelected && { backgroundColor: colors.tint },
                !isSelected && {
                  backgroundColor: day.hasLog ? "#FFF7E6" : "#F3F4F6",
                  borderColor: day.hasLog ? "#FFD166" : "transparent",
                },
              ]}
              onPress={() => onDateChange(day.dateStr)}
            >
              <Text
                style={[
                  styles.calendarDayName,
                  {
                    color: isSelected
                      ? "#fff"
                      : day.hasLog
                        ? "#B45309"
                        : colors.icon,
                  },
                ]}
              >
                {day.dayName}
              </Text>
              <Text
                style={[
                  styles.calendarDayNum,
                  {
                    color: isSelected
                      ? "#fff"
                      : day.hasLog
                        ? "#B45309"
                        : colors.text,
                  },
                  day.isToday &&
                    !isSelected && { color: colors.tint, fontWeight: "bold" },
                ]}
              >
                {day.dayNum}
              </Text>
              {day.isToday && (
                <View
                  style={[
                    styles.todayIndicator,
                    { backgroundColor: isSelected ? "#fff" : colors.tint },
                  ]}
                />
              )}
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
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: "transparent",
    position: "relative",
  },
  calendarDayName: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  calendarDayNum: {
    fontSize: 18,
    fontWeight: "bold",
  },
  todayIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: "absolute",
    bottom: 6,
  },
});
