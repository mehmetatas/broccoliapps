import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTheme } from "../theme/ThemeContext";

interface DateRangeModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (startDate: Date, endDate: Date) => void;
  initialStartDate?: Date;
  initialEndDate?: Date;
}

export function DateRangeModal({
  visible,
  onClose,
  onConfirm,
  initialStartDate,
  initialEndDate,
}: DateRangeModalProps): React.JSX.Element {
  const { theme, isDark } = useTheme();
  const [startDate, setStartDate] = useState(initialStartDate || new Date());
  const [endDate, setEndDate] = useState(initialEndDate || new Date());
  const [showStartPicker, setShowStartPicker] = useState(Platform.OS === "ios");
  const [showEndPicker, setShowEndPicker] = useState(Platform.OS === "ios");

  const handleConfirm = () => {
    // Ensure end date is not before start date
    const validEndDate = endDate < startDate ? startDate : endDate;
    onConfirm(startDate, validEndDate);
  };

  const onStartChange = (_event: unknown, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowStartPicker(false);
    }
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  const onEndChange = (_event: unknown, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowEndPicker(false);
    }
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  const formatDisplayDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.content, { backgroundColor: theme.surface }]}>
          <Text style={[styles.title, { color: theme.text }]}>
            Custom Date Range
          </Text>

          {/* Start Date */}
          <View style={styles.dateSection}>
            <Text style={[styles.dateLabel, { color: theme.textSecondary }]}>
              Start Date
            </Text>
            {Platform.OS === "android" && !showStartPicker && (
              <TouchableOpacity
                style={[styles.dateButton, { backgroundColor: theme.background }]}
                onPress={() => setShowStartPicker(true)}
              >
                <Text style={[styles.dateText, { color: theme.text }]}>
                  {formatDisplayDate(startDate)}
                </Text>
              </TouchableOpacity>
            )}
            {showStartPicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={onStartChange}
                themeVariant={isDark ? "dark" : "light"}
              />
            )}
          </View>

          {/* End Date */}
          <View style={styles.dateSection}>
            <Text style={[styles.dateLabel, { color: theme.textSecondary }]}>
              End Date
            </Text>
            {Platform.OS === "android" && !showEndPicker && (
              <TouchableOpacity
                style={[styles.dateButton, { backgroundColor: theme.background }]}
                onPress={() => setShowEndPicker(true)}
              >
                <Text style={[styles.dateText, { color: theme.text }]}>
                  {formatDisplayDate(endDate)}
                </Text>
              </TouchableOpacity>
            )}
            {showEndPicker && (
              <DateTimePicker
                value={endDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={onEndChange}
                minimumDate={startDate}
                themeVariant={isDark ? "dark" : "light"}
              />
            )}
          </View>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.background }]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={[styles.buttonText, { color: theme.textSecondary }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.accent }]}
              onPress={handleConfirm}
              activeOpacity={0.7}
            >
              <Text style={[styles.buttonText, { color: theme.accentText }]}>
                Confirm
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  content: {
    width: "100%",
    borderRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 20,
  },
  dateSection: {
    marginBottom: 16,
  },
  dateLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  dateButton: {
    padding: 12,
    borderRadius: 8,
  },
  dateText: {
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
