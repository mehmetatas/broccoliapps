import { useTheme } from "@broccoliapps/mobile";
import { LIMITS } from "@broccoliapps/tasquito-shared";
import { useRef, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

type Props = {
  onSubmit: (data: { title: string }) => void;
};

export const TaskForm = ({ onSubmit }: Props) => {
  const { colors } = useTheme();
  const [title, setTitle] = useState("");
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

  return (
    <View style={styles.row}>
      <TextInput
        ref={inputRef}
        style={[
          styles.input,
          {
            backgroundColor: colors.inputBackground,
            color: colors.inputText,
            borderColor: colors.border,
          },
        ]}
        placeholder="New task title"
        placeholderTextColor={colors.inputPlaceholder}
        value={title}
        onChangeText={setTitle}
        maxLength={LIMITS.MAX_TASK_TITLE_LENGTH}
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
        blurOnSubmit={false}
      />
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: canSubmit ? colors.accent : colors.accentDisabled,
          },
        ]}
        onPress={handleSubmit}
        disabled={!canSubmit}
        activeOpacity={0.7}
      >
        <Text style={styles.buttonText}>Add</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 10,
  },
  input: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 16,
    fontFamily: "Nunito-Regular",
  },
  button: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 15,
    fontFamily: "Nunito-SemiBold",
    color: "#ffffff",
  },
});
