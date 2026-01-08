import React, { useState } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { getCategories } from '../storage/categories';
import { useTheme } from '../theme/ThemeContext';

interface CategoryDataPoint {
  category: string;
  amount: number;
}

interface CategoryPieChartProps {
  data: CategoryDataPoint[];
}

const screenWidth = Dimensions.get('window').width;
const CHART_WIDTH = screenWidth - 32;

// Distinct colors for categories
const CATEGORY_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
  '#F7DC6F', // Gold
  '#BB8FCE', // Purple
  '#85C1E9', // Light Blue
  '#F8B500', // Orange
  '#58D68D', // Emerald
];

export function CategoryPieChart({
  data,
}: CategoryPieChartProps): React.JSX.Element {
  const { theme } = useTheme();
  const [showPercentage, setShowPercentage] = useState(false);

  const categories = getCategories();
  const categoriesById = Object.fromEntries(categories.map(c => [c.id, c]));

  const total = data.reduce((sum, d) => sum + d.amount, 0);

  // Transform data for pie chart - include value in the name for display
  const pieData = data.map((d, index) => {
    const category = categoriesById[d.category];
    const percentage = total > 0 ? (d.amount / total) * 100 : 0;
    const label = category?.label ?? d.category;
    const valueLabel = showPercentage
      ? `${percentage.toFixed(0)}%`
      : `$${d.amount}`;

    return {
      name: `${label} ${valueLabel}`,
      population: d.amount,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
      legendFontColor: theme.text,
      legendFontSize: 11,
    };
  });

  const chartConfig = {
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => setShowPercentage(!showPercentage)}
      activeOpacity={0.8}
    >
      {/* Hint text */}
      <Text style={[styles.hint, { color: theme.textSecondary }]}>
        Tap to show {showPercentage ? '$' : '%'}
      </Text>

      {/* Pie Chart with built-in legend */}
      <PieChart
        data={pieData}
        width={CHART_WIDTH}
        height={200}
        chartConfig={chartConfig}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="0"
        absolute
        hasLegend={true}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  hint: {
    fontSize: 11,
    marginBottom: 4,
    alignSelf: 'flex-end',
    paddingRight: 8,
  },
});
