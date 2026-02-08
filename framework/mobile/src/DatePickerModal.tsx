import DateTimePicker from "@react-native-community/datetimepicker";
import { useCallback, useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { SlideInDown, SlideOutDown } from "react-native-reanimated";
import { useTheme } from "./theme";

type DatePickerModalProps = {
  visible: boolean;
  initialDate?: string;
  onDateSelect: (date: string) => void;
  onClearDate: () => void;
  onClose: () => void;
};

export const DatePickerModal = ({ visible, initialDate, onDateSelect, onClearDate, onClose }: DatePickerModalProps) => {
  const { colors } = useTheme();
  const [tempDate, setTempDate] = useState<string | undefined>(initialDate);

  const handleDateChange = useCallback(
    (date: Date | undefined) => {
      if (date) {
        const formatted = date.toISOString().split("T")[0]!;
        setTempDate(formatted);
        if (Platform.OS === "android") {
          onClose();
          onDateSelect(formatted);
        }
      }
    },
    [onDateSelect, onClose],
  );

  const handleDone = useCallback(() => {
    const selectedDate = tempDate ?? new Date().toISOString().split("T")[0]!;
    onClose();
    onDateSelect(selectedDate);
  }, [tempDate, onDateSelect, onClose]);

  const handleClear = useCallback(() => {
    onClose();
    onClearDate();
  }, [onClearDate, onClose]);

  if (!visible) {
    return null;
  }

  if (Platform.OS === "android") {
    return (
      <DateTimePicker
        value={tempDate ? new Date(tempDate) : new Date()}
        mode="date"
        onChange={(_event, selectedDate) => {
          onClose();
          if (selectedDate) {
            handleDateChange(selectedDate);
          }
        }}
      />
    );
  }

  return (
    <Modal visible={true} transparent animationType="fade">
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <Animated.View
          style={[styles.content, { backgroundColor: colors.background }]}
          entering={SlideInDown.duration(300)}
          exiting={SlideOutDown.duration(200)}
        >
          <View style={[styles.header, { borderBottomColor: colors.divider }]}>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Text style={[styles.cancelText, { color: colors.textMuted }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleClear} hitSlop={8}>
              <Text style={styles.clearText}>Clear date</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDone} hitSlop={8}>
              <Text style={[styles.doneText, { color: colors.accent }]}>Done</Text>
            </TouchableOpacity>
          </View>
          <DateTimePicker
            value={tempDate ? new Date(tempDate) : new Date()}
            mode="date"
            display="spinner"
            onChange={(_event, selectedDate) => {
              if (selectedDate) {
                handleDateChange(selectedDate);
              }
            }}
            style={styles.spinner}
          />
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  content: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cancelText: {
    fontSize: 18,
    fontFamily: "Nunito-Regular",
  },
  clearText: {
    fontSize: 18,
    fontFamily: "Nunito-Regular",
    color: "#e53e3e",
  },
  doneText: {
    fontSize: 18,
    fontFamily: "Nunito-SemiBold",
  },
  spinner: {
    height: 200,
  },
});
