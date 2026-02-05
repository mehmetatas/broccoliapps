import { useTheme } from "@broccoliapps/mobile";
import { LIMITS } from "@broccoliapps/tasquito-shared";
import { Check, MoreHorizontal, X } from "lucide-react-native";
import { useRef, useState } from "react";
import { Keyboard, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";

export type TaskFormData = {
  title: string;
  description?: string;
  dueDate?: string;
  subtasks?: string[];
};

type Props = {
  onSubmit: (data: TaskFormData) => void;
  onOpenModal: (title: string) => void;
};

export const TaskForm = ({ onSubmit, onOpenModal }: Props) => {
  const { colors } = useTheme();
  const [title, setTitle] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const trimmed = title.trim();
  const canSubmit = trimmed.length > 0;

  const handleSubmit = () => {
    if (!trimmed) {
      return;
    }
    onSubmit({ title: trimmed });
    setTitle("");
    inputRef.current?.focus();
  };

  const handleOpenModal = () => {
    onOpenModal(title);
    setTitle("");
  };

  const handleCancel = () => {
    setTitle("");
    Keyboard.dismiss();
    setIsFocused(false);
  };

  return (
    <View style={styles.row}>
      <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
        <TextInput
          ref={inputRef}
          style={[styles.input, { color: colors.inputText }]}
          placeholder="New task title"
          placeholderTextColor={colors.inputPlaceholder}
          value={title}
          onChangeText={setTitle}
          maxLength={LIMITS.MAX_TASK_TITLE_LENGTH}
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
          submitBehavior="submit"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {isFocused && (
          <View style={styles.inputActions}>
            <TouchableOpacity onPress={handleCancel} hitSlop={8} activeOpacity={0.6}>
              <X size={18} color={colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSubmit} hitSlop={8} activeOpacity={0.6} disabled={!canSubmit}>
              <Check size={18} color={canSubmit ? colors.accent : colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}
      </View>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, borderWidth: 1 }]}
        onPress={handleOpenModal}
        activeOpacity={0.7}
      >
        <MoreHorizontal size={20} color={colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 10,
  },
  inputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
  },
  input: {
    flex: 1,
    height: 44,
    paddingLeft: 14,
    paddingRight: 8,
    fontSize: 16,
    fontFamily: "Nunito-Regular",
  },
  inputActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingRight: 12,
  },
  button: {
    height: 44,
    width: 44,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
});
