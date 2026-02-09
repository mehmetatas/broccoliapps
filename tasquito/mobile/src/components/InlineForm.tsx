import { CharacterLimitIndicator, useTheme } from "@broccoliapps/mobile";
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
  softLimit?: number;
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
  softLimit,
}: InlineFormProps) => {
  const { colors } = useTheme();

  const effectiveMaxLength = softLimit ? Math.floor(softLimit * 1.5) : maxLength;
  const isOverSoftLimit = softLimit ? value.trim().length > softLimit : false;
  const effectiveCanSubmit = canSubmit && !isOverSoftLimit;

  return (
    <View>
      <View
        style={[
          styles.inputContainer,
          {
            borderBottomColor: error ? colors.error : colors.border,
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
          maxLength={effectiveMaxLength}
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
            <TouchableOpacity onPress={onSubmit} hitSlop={8} activeOpacity={0.6} disabled={!effectiveCanSubmit}>
              <Check size={18} color={effectiveCanSubmit ? colors.accent : colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}
      </View>
      {softLimit && isFocused && <CharacterLimitIndicator textLength={value.length} softLimit={softLimit} />}
      {error && <Text style={[styles.error, { color: colors.error }]}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Nunito-Regular",
    padding: 0,
    margin: 0,
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
