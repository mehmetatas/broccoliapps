import { BottomModal, useTheme } from "@broccoliapps/mobile";
import { LIMITS } from "@broccoliapps/tasquito-shared";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Calendar, Check, X } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import DraggableFlatList, { type RenderItemParams } from "react-native-draggable-flatlist";
import { FlatList } from "react-native-gesture-handler";
import ReactNativeHapticFeedback from "react-native-haptic-feedback";
import Animated, { SlideInDown, SlideOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type TaskFormData = {
  title: string;
  note?: string;
  dueDate?: string;
  subtasks?: string[];
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: TaskFormData) => void;
  initialTitle?: string;
};

type SubtaskItem = {
  id: string;
  title: string;
};

export const TaskDetailModal = ({ visible, onClose, onSubmit, initialTitle }: Props) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [subtasks, setSubtasks] = useState<SubtaskItem[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempPickerDate, setTempPickerDate] = useState("");
  const [noteKey, setNoteKey] = useState(0);

  const noteInputRef = useRef<TextInput>(null);
  const subtaskInputRef = useRef<TextInput>(null);
  const listRef = useRef<FlatList<SubtaskItem>>(null);
  const idCounter = useRef(0);
  const shouldScrollToBottom = useRef(false);

  useEffect(() => {
    if (visible) {
      setTitle(initialTitle ?? "");
      setNote("");
      setDueDate("");
      setSubtasks([]);
      setNewSubtaskTitle("");
      setShowDatePicker(false);
      setNoteKey((prev) => prev + 1);
    }
  }, [visible, initialTitle]);

  const canSubmit = title.trim().length > 0;

  const handleSubmit = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      return;
    }

    onSubmit({
      title: trimmedTitle,
      note: note.trim() || undefined,
      dueDate: dueDate.trim() || undefined,
      subtasks: subtasks.length > 0 ? subtasks.map((s) => s.title) : undefined,
    });
    onClose();
  };

  const addSubtask = () => {
    const t = newSubtaskTitle.trim();
    if (!t) {
      return;
    }
    shouldScrollToBottom.current = true;
    setSubtasks((prev) => [...prev, { id: `new-${idCounter.current++}`, title: t }]);
    setNewSubtaskTitle("");
    subtaskInputRef.current?.focus();
  };

  const handleContentSizeChange = useCallback((_width: number, height: number) => {
    if (shouldScrollToBottom.current) {
      shouldScrollToBottom.current = false;
      setTimeout(() => {
        listRef.current?.scrollToOffset({ offset: height, animated: true });
      }, 50);
    }
  }, []);

  const removeSubtask = (id: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
  };

  const handleDragEnd = useCallback(({ data }: { data: SubtaskItem[] }) => {
    setSubtasks(data);
  }, []);

  const renderSubtaskItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<SubtaskItem>) => (
      <View style={[styles.subtaskRow, { borderBottomColor: colors.divider, backgroundColor: isActive ? colors.backgroundTertiary : colors.background }]}>
        <TouchableOpacity
          onLongPress={() => {
            ReactNativeHapticFeedback.trigger("impactMedium");
            drag();
          }}
          delayLongPress={150}
          style={styles.subtaskDragHandle}
        >
          <View style={[styles.subtaskDot, { backgroundColor: colors.accent }]} />
        </TouchableOpacity>
        <TouchableOpacity
          onLongPress={() => {
            ReactNativeHapticFeedback.trigger("impactMedium");
            drag();
          }}
          delayLongPress={150}
          style={styles.subtaskTextTouchable}
          activeOpacity={0.7}
        >
          <Text style={[styles.subtaskText, { color: colors.textPrimary }]} numberOfLines={1}>
            {item.title}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => removeSubtask(item.id)} hitSlop={6} activeOpacity={0.6}>
          <X size={16} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    ),
    [colors],
  );

  const headerRight = (
    <TouchableOpacity onPress={handleSubmit} disabled={!canSubmit} hitSlop={8} activeOpacity={0.6}>
      <Check size={24} color={canSubmit ? "#10b981" : colors.textMuted} strokeWidth={2.5} />
    </TouchableOpacity>
  );

  const listHeader = (
    <View style={styles.modalBody}>
      {/* Title */}
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.textMuted }]}>TITLE</Text>
        <TextInput
          style={[styles.modalInput, { backgroundColor: colors.inputBackground, color: colors.inputText, borderColor: colors.border }]}
          placeholder="Task title"
          placeholderTextColor={colors.inputPlaceholder}
          value={title}
          onChangeText={setTitle}
          maxLength={LIMITS.MAX_TASK_TITLE_LENGTH}
        />
        {title.length >= LIMITS.MAX_TASK_TITLE_LENGTH && <Text style={[styles.limitText, { color: colors.textTertiary }]}>Character limit reached</Text>}
      </View>

      {/* Due Date */}
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.textMuted }]}>DUE DATE</Text>
        <TouchableOpacity
          style={[styles.datePickerButton, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
          onPress={() => {
            // Initialize temp date to current dueDate or today
            setTempPickerDate(dueDate || new Date().toISOString().split("T")[0]);
            setShowDatePicker(true);
          }}
          activeOpacity={0.7}
        >
          <Calendar size={18} color={colors.textMuted} />
          <Text style={[styles.datePickerText, { color: dueDate ? colors.inputText : colors.inputPlaceholder }]}>{dueDate || "Select date"}</Text>
          {dueDate && (
            <TouchableOpacity onPress={() => setDueDate("")} hitSlop={8} activeOpacity={0.6}>
              <X size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
        {showDatePicker && Platform.OS === "android" && (
          <DateTimePicker
            value={dueDate ? new Date(dueDate) : new Date()}
            mode="date"
            onChange={(_event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                const formatted = selectedDate.toISOString().split("T")[0];
                setDueDate(formatted);
              }
              setTimeout(() => {
                subtaskInputRef.current?.focus();
              }, 100);
            }}
          />
        )}
        {showDatePicker && Platform.OS === "ios" && (
          <Modal visible={true} transparent animationType="fade">
            <View style={styles.datePickerModalOverlay}>
              <Pressable style={styles.datePickerModalBackdrop} onPress={() => setShowDatePicker(false)} />
              <Animated.View
                style={[styles.datePickerModalContent, { backgroundColor: colors.background }]}
                entering={SlideInDown.duration(300)}
                exiting={SlideOutDown.duration(200)}
              >
                <View style={[styles.datePickerModalHeader, { borderBottomColor: colors.divider }]}>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)} hitSlop={8}>
                    <Text style={[styles.datePickerModalCancel, { color: colors.textMuted }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setShowDatePicker(false);
                      setDueDate("");
                    }}
                    hitSlop={8}
                  >
                    <Text style={styles.datePickerModalClear}>Clear date</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setShowDatePicker(false);
                      setDueDate(tempPickerDate);
                      setTimeout(() => {
                        subtaskInputRef.current?.focus();
                      }, 250);
                    }}
                    hitSlop={8}
                  >
                    <Text style={[styles.datePickerModalDone, { color: colors.accent }]}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={tempPickerDate ? new Date(tempPickerDate) : new Date()}
                  mode="date"
                  display="spinner"
                  onChange={(_event, selectedDate) => {
                    if (selectedDate) {
                      const formatted = selectedDate.toISOString().split("T")[0];
                      setTempPickerDate(formatted);
                    }
                  }}
                  style={styles.datePickerSpinner}
                />
              </Animated.View>
            </View>
          </Modal>
        )}
      </View>

      {/* Subtasks label */}
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.textMuted }]}>SUBTASKS</Text>
      </View>
    </View>
  );

  const listFooter = (
    <View style={styles.subtaskFooter}>
      {subtasks.length >= LIMITS.MAX_SUBTASKS_PER_TASK ? (
        <Text style={[styles.limitText, { color: colors.textTertiary }]}>
          If a task needs more than {LIMITS.MAX_SUBTASKS_PER_TASK} subtasks, consider breaking it into smaller tasks.
        </Text>
      ) : (
        <View style={styles.addSubtaskRow}>
          <TextInput
            ref={subtaskInputRef}
            style={[styles.modalInput, styles.subtaskInput, { backgroundColor: colors.inputBackground, color: colors.inputText, borderColor: colors.border }]}
            placeholder="Add a subtask..."
            placeholderTextColor={colors.inputPlaceholder}
            value={newSubtaskTitle}
            onChangeText={setNewSubtaskTitle}
            maxLength={LIMITS.MAX_SUBTASK_TITLE_LENGTH}
            returnKeyType="done"
            onSubmitEditing={addSubtask}
            submitBehavior="submit"
          />
          {newSubtaskTitle.trim().length > 0 && (
            <TouchableOpacity style={[styles.addSubtaskButton, { backgroundColor: colors.accent }]} onPress={addSubtask} activeOpacity={0.7}>
              <Text style={styles.addSubtaskButtonText}>+</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Note */}
      <View style={[styles.field, styles.noteField]}>
        <Text style={[styles.label, { color: colors.textMuted }]}>NOTE</Text>
        {/* key forces remount to reset internal height state when modal reopens with different content */}
        <TextInput
          key={noteKey}
          ref={noteInputRef}
          style={[styles.modalInput, styles.textArea, { backgroundColor: colors.inputBackground, color: colors.inputText, borderColor: colors.border }]}
          placeholder="Task note"
          placeholderTextColor={colors.inputPlaceholder}
          value={note}
          onChangeText={setNote}
          maxLength={LIMITS.MAX_TASK_NOTE_LENGTH}
          multiline
          textAlignVertical="top"
          scrollEnabled={false}
        />
        {note.length >= LIMITS.MAX_TASK_NOTE_LENGTH && <Text style={[styles.limitText, { color: colors.textTertiary }]}>Character limit reached</Text>}
      </View>
    </View>
  );

  return (
    <BottomModal visible={visible} onClose={onClose} title="New Task" headerRight={headerRight}>
      <DraggableFlatList<SubtaskItem>
        ref={listRef}
        data={subtasks}
        keyExtractor={(item) => item.id}
        renderItem={renderSubtaskItem}
        onDragEnd={handleDragEnd}
        onContentSizeChange={handleContentSizeChange}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        contentContainerStyle={[styles.listContent, { paddingBottom: 48 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
      />
    </BottomModal>
  );
};

const styles = StyleSheet.create({
  modalBody: {
    gap: 20,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontFamily: "Nunito-SemiBold",
    letterSpacing: 0.8,
  },
  modalInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: "Nunito-Regular",
  },
  textArea: {
    height: undefined,
    minHeight: 80,
    paddingTop: 10,
    paddingBottom: 10,
  },
  limitText: {
    fontSize: 12,
    fontFamily: "Nunito-Regular",
    fontStyle: "italic",
  },
  datePickerButton: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  datePickerText: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Nunito-Regular",
  },
  datePickerModalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  datePickerModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  datePickerModalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 20,
  },
  datePickerModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  datePickerModalCancel: {
    fontSize: 16,
    fontFamily: "Nunito-Regular",
  },
  datePickerModalClear: {
    fontSize: 16,
    fontFamily: "Nunito-Regular",
    color: "#e53e3e",
  },
  datePickerModalDone: {
    fontSize: 16,
    fontFamily: "Nunito-SemiBold",
  },
  datePickerSpinner: {
    height: 200,
  },
  subtaskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  subtaskDragHandle: {
    paddingVertical: 4,
    paddingRight: 4,
  },
  subtaskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  subtaskTextTouchable: {
    flex: 1,
  },
  subtaskText: {
    fontSize: 14,
    fontFamily: "Nunito-Regular",
  },
  addSubtaskRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  subtaskInput: {
    flex: 1,
  },
  addSubtaskButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  addSubtaskButtonText: {
    fontSize: 20,
    fontFamily: "Nunito-SemiBold",
    color: "#ffffff",
    lineHeight: 22,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  subtaskFooter: {
    paddingTop: 8,
  },
  noteField: {
    marginTop: 20,
  },
});
