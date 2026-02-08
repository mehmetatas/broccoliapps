import { useTheme } from "@broccoliapps/mobile";
import { LIMITS } from "@broccoliapps/tasquito-shared";
import { Check, X } from "lucide-react-native";
import { useRef, useState } from "react";
import { Keyboard, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";

export type TaskFormData = {
  title: string;
};

type Props = {
  onSubmit: (data: TaskFormData) => void;
};

export const TaskForm = ({ onSubmit }: Props) => {
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

  const handleCancel = () => {
    setTitle("");
    Keyboard.dismiss();
    setIsFocused(false);
  };

  return (
    <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
      <TextInput
        ref={inputRef}
        style={[styles.input, { color: colors.inputText }]}
        placeholder="New task"
        placeholderTextColor={colors.inputPlaceholder}
        value={title}
        onChangeText={setTitle}
        maxLength={LIMITS.MAX_TASK_TITLE_LENGTH}
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
        submitBehavior="blurAndSubmit"
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
  );
};

const styles = StyleSheet.create({
  inputContainer: {
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
});
