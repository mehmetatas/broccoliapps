import { useTheme } from "@broccoliapps/mobile";
import { LIMITS } from "@broccoliapps/tasquito-shared";
import { Check, X } from "lucide-react-native";
import { useState } from "react";
import { Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

type Props = {
  onSubmit: (name: string) => Promise<unknown>;
};

export const ProjectForm = ({ onSubmit }: Props) => {
  const { colors } = useTheme();
  const [name, setName] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = name.trim();
  const canSubmit = trimmed.length > 0 && !isSubmitting;

  const handleSubmit = async () => {
    if (!trimmed) {
      return;
    }

    setError(null);
    setIsSubmitting(true);
    Keyboard.dismiss();
    setIsFocused(false);
    try {
      await onSubmit(trimmed);
      setName("");
    } catch {
      setError("Failed to create project");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setName("");
    setError(null);
    Keyboard.dismiss();
    setIsFocused(false);
  };

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
          style={[styles.input, { color: colors.inputText }]}
          placeholder="New project"
          placeholderTextColor={colors.inputPlaceholder}
          value={name}
          onChangeText={(text) => {
            setName(text);
            if (error) {
              setError(null);
            }
          }}
          maxLength={LIMITS.MAX_PROJECT_NAME_LENGTH}
          editable={!isSubmitting}
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
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
