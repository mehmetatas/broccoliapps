import { useTheme } from "@broccoliapps/mobile";
import { LIMITS } from "@broccoliapps/tasquito-shared";
import { useState } from "react";
import { Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

type Props = {
  onSubmit: (name: string) => Promise<unknown>;
};

export const ProjectForm = ({ onSubmit }: Props) => {
  const { colors } = useTheme();
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = name.trim();
  const canSubmit = trimmed.length > 0 && !isSubmitting;

  const handleSubmit = async () => {
    if (!trimmed) {
      setError("Name is required");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    Keyboard.dismiss();
    try {
      await onSubmit(trimmed);
      setName("");
    } catch {
      setError("Failed to create project");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View>
      <View style={styles.row}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.inputBackground,
              color: colors.inputText,
              borderColor: error ? colors.error : colors.border,
            },
          ]}
          placeholder="New project name"
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
          <Text style={styles.buttonText}>{isSubmitting ? "Creating..." : "Create"}</Text>
        </TouchableOpacity>
      </View>
      {error && <Text style={[styles.error, { color: colors.error }]}>{error}</Text>}
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
  error: {
    fontSize: 13,
    fontFamily: "Nunito-Regular",
    marginTop: 6,
  },
});
