import React, { useState } from "react";
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { CategoryPieChart } from "./CategoryPieChart";
import { DailyExpensesChart } from "./DailyExpensesChart";

interface ChartCarouselProps {
  dailyData: { date: string; amount: number }[];
  categoryData: { category: string; amount: number }[];
}

const { width: screenWidth } = Dimensions.get("window");
const CHART_WIDTH = screenWidth - 32;

export function ChartCarousel({
  dailyData,
  categoryData,
}: ChartCarouselProps): React.JSX.Element {
  const { theme } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / CHART_WIDTH);
    if (index !== currentIndex && index >= 0 && index <= 1) {
      setCurrentIndex(index);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={CHART_WIDTH}
        snapToAlignment="center"
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Page 1: Line Chart */}
        <View style={[styles.chartPage, { width: CHART_WIDTH }]}>
          <DailyExpensesChart data={dailyData} />
        </View>

        {/* Page 2: Pie Chart */}
        <View style={[styles.chartPage, { width: CHART_WIDTH }]}>
          <CategoryPieChart data={categoryData} />
        </View>
      </ScrollView>

      {/* Dot Indicators */}
      <View style={styles.dotsContainer}>
        {[0, 1].map(index => (
          <View
            key={index}
            style={[
              styles.dot,
              index === currentIndex
                ? [styles.dotActive, { backgroundColor: theme.text }]
                : [styles.dotInactive, { backgroundColor: theme.textSecondary }],
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  scrollContent: {
    paddingHorizontal: 0,
  },
  chartPage: {
    alignItems: "center",
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    gap: 6,
  },
  dot: {
    borderRadius: 4,
  },
  dotActive: {
    width: 8,
    height: 8,
  },
  dotInactive: {
    width: 6,
    height: 6,
  },
});
