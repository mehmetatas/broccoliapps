import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { useTheme } from "../theme/ThemeContext";

type ChartDataPoint = {
  date: string;
  amount: number;
};

type DailyExpensesChartProps = {
  data: ChartDataPoint[];
};

const screenWidth = Dimensions.get("window").width;

const formatDayLabel = (dateString: string): string => {
  return new Date(dateString + "T00:00:00").getDate().toString();
};

export const DailyExpensesChart = ({ data }: DailyExpensesChartProps): React.JSX.Element => {
  const { theme, isDark } = useTheme();

  // Transform data to chart-kit format
  const chartData = {
    labels: data.map((d) => formatDayLabel(d.date)),
    datasets: [
      {
        data: data.length > 0 ? data.map((d) => d.amount) : [0],
        strokeWidth: 2,
      },
    ],
  };

  // Show every nth label to avoid overcrowding
  const labelStep = data.length > 10 ? Math.ceil(data.length / 7) : 1;
  const filteredLabels = chartData.labels.map((label, index) => (index % labelStep === 0 ? label : ""));

  const chartConfig = {
    backgroundColor: theme.surface,
    backgroundGradientFrom: theme.surface,
    backgroundGradientTo: theme.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => {
      // Use accent color with opacity
      const r = parseInt(theme.accent.slice(1, 3), 16);
      const g = parseInt(theme.accent.slice(3, 5), 16);
      const b = parseInt(theme.accent.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    },
    labelColor: () => theme.textSecondary,
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: theme.accent,
    },
    propsForBackgroundLines: {
      strokeDasharray: "",
      stroke: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
    },
  };

  return (
    <View style={styles.container}>
      <LineChart
        data={{
          ...chartData,
          labels: filteredLabels,
        }}
        width={screenWidth - 32}
        height={200}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
        withInnerLines={true}
        withOuterLines={false}
        withVerticalLabels={true}
        withHorizontalLabels={true}
        fromZero
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  chart: {
    borderRadius: 12,
  },
});
