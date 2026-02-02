import { useNavigation } from "@react-navigation/native";
import { ChevronLeft } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChartCarousel } from "../components/ChartCarousel";
import { DateRangeModal } from "../components/DateRangeModal";
import { PillPicker } from "../components/PillPicker";
import { SpendRecordItem } from "../components/SpendRecordItem";
import { useTheme } from "../theme/ThemeContext";
import { SpendRecord } from "../types/spendRecord";

const DATE_RANGE_OPTIONS: Record<string, string> = {
  "all-time": "All Time",
  "this-month": "This Month",
  "last-month": "Last Month",
  "last-30-days": "Last 30 Days",
  custom: "Custom",
};

// Mock chart data - daily spending for the past 10 days
const MOCK_CHART_DATA = [
  { date: "2026-01-01", amount: 45 },
  { date: "2026-01-02", amount: 120 },
  { date: "2026-01-03", amount: 30 },
  { date: "2026-01-04", amount: 85 },
  { date: "2026-01-05", amount: 200 },
  { date: "2026-01-06", amount: 65 },
  { date: "2026-01-07", amount: 150 },
];

// Mock spend records
const MOCK_SPEND_RECORDS: SpendRecord[] = [
  { id: "1", amount: 150, category: "groceries", date: "2026-01-07" },
  { id: "2", amount: 65, category: "transportation", date: "2026-01-06" },
  { id: "3", amount: 200, category: "utilities", date: "2026-01-05" },
  { id: "4", amount: 85, category: "eat-out", date: "2026-01-04" },
  { id: "5", amount: 30, category: "entertainment", date: "2026-01-03" },
  { id: "6", amount: 120, category: "health", date: "2026-01-02" },
  { id: "7", amount: 45, category: "personal-care", date: "2026-01-01" },
];

// Mock category data for pie chart
const MOCK_CATEGORY_DATA = [
  { category: "groceries", amount: 150 },
  { category: "transportation", amount: 65 },
  { category: "utilities", amount: 200 },
  { category: "eat-out", amount: 85 },
  { category: "entertainment", amount: 30 },
  { category: "health", amount: 120 },
  { category: "personal-care", amount: 45 },
];

export function DashboardScreen(): React.JSX.Element {
  const { theme } = useTheme();
  const navigation = useNavigation();

  // Date range state
  const [selectedRange, setSelectedRange] = useState("all-time");
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
  const [showDateModal, setShowDateModal] = useState(false);

  // Data state (using mock data for now)
  const [spendRecords, setSpendRecords] =
    useState<SpendRecord[]>(MOCK_SPEND_RECORDS);

  const handleRangeSelect = (rangeId: string) => {
    setSelectedRange(rangeId);
    if (rangeId === "custom") {
      setShowDateModal(true);
    }
  };

  const handleDateConfirm = (startDate: Date, endDate: Date) => {
    setCustomStartDate(startDate);
    setCustomEndDate(endDate);
    setShowDateModal(false);
  };

  const handleDeleteRecord = useCallback((record: SpendRecord) => {
    setSpendRecords(prev => prev.filter(r => r.id !== record.id));
  }, []);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top"]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ChevronLeft size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Dashboard</Text>
        <View style={styles.backButton} />
      </View>

      {/* Date Range Pills */}
      <View style={styles.pillContainer}>
        <PillPicker
          items={DATE_RANGE_OPTIONS}
          selectedId={selectedRange}
          onSelect={handleRangeSelect}
        />
      </View>

      {/* Custom date range label */}
      {selectedRange === "custom" && customStartDate && customEndDate && (
        <Text style={[styles.customRangeLabel, { color: theme.textSecondary }]}>
          {customStartDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}{" "}
          -{" "}
          {customEndDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </Text>
      )}

      {/* Scrollable Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Chart Carousel */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Spending Overview
          </Text>
          <ChartCarousel
            dailyData={MOCK_CHART_DATA}
            categoryData={MOCK_CATEGORY_DATA}
          />
        </View>

        {/* Spend Records List */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Transactions
          </Text>
          {spendRecords.map(record => (
            <SpendRecordItem
              key={record.id}
              record={record}
              onDelete={handleDeleteRecord}
            />
          ))}
        </View>
      </ScrollView>

      {/* Date Range Modal */}
      <DateRangeModal
        visible={showDateModal}
        onClose={() => setShowDateModal(false)}
        onConfirm={handleDateConfirm}
        initialStartDate={customStartDate || new Date()}
        initialEndDate={customEndDate || new Date()}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
  },
  pillContainer: {
    marginTop: 8,
  },
  customRangeLabel: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 24,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
});
