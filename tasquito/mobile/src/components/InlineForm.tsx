import { useTheme } from "@broccoliapps/mobile";
import { Check, X } from "lucide-react-native";
import type { RefObject } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

type InlineFormProps = {
  placeholder: string;
  maxLength: number;
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  canSubmit: boolean;
  disabled?: boolean;
  error?: string | null;
  isFocused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  inputRef?: RefObject<TextInput | null>;
  submitBehavior?: "blurAndSubmit" | "submit";
};

export const InlineForm = ({
  placeholder,
  maxLength,
  value,
  onChangeText,
  onSubmit,
  onCancel,
  canSubmit,
  disabled,
  error,
  isFocused,
  onFocus,
  onBlur,
  inputRef,
  submitBehavior,
}: InlineFormProps) => {
  const { colors } = useTheme();

  return (
    <View>
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.inputBackground,
            borderColor: error ? colors.error : colors.border,
          },
        ]}
      >
        <TextInput
          ref={inputRef}
          style={[styles.input, { color: colors.inputText }]}
          placeholder={placeholder}
          placeholderTextColor={colors.inputPlaceholder}
          value={value}
          onChangeText={onChangeText}
          maxLength={maxLength}
          editable={!disabled}
          returnKeyType="done"
          onSubmitEditing={onSubmit}
          onFocus={onFocus}
          onBlur={onBlur}
          submitBehavior={submitBehavior}
        />
        {isFocused && (
          <View style={styles.inputActions}>
            <TouchableOpacity onPress={onCancel} hitSlop={8} activeOpacity={0.6}>
              <X size={18} color={colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onSubmit} hitSlop={8} activeOpacity={0.6} disabled={!canSubmit}>
              <Check size={18} color={canSubmit ? colors.accent : colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}
      </View>
      {error && <Text style={[styles.error, { color: colors.error }]}>{error}</Text>}
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
  error: {
    fontSize: 13,
    fontFamily: "Nunito-Regular",
    marginTop: 6,
  },
});
