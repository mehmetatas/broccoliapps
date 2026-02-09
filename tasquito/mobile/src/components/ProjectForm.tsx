import { LIMITS } from "@broccoliapps/tasquito-shared";
import { useState } from "react";
import { Keyboard } from "react-native";
import { InlineForm } from "./InlineForm";

type Props = {
  onSubmit: (name: string) => Promise<unknown>;
};

export const ProjectForm = ({ onSubmit }: Props) => {
  const [name, setName] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = name.trim();
  const canSubmit = trimmed.length > 0 && !isSubmitting;

  const handleSubmit = async () => {
    if (!trimmed || trimmed.length > LIMITS.MAX_PROJECT_NAME_LENGTH) {
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
    <InlineForm
      placeholder="New project"
      maxLength={LIMITS.MAX_PROJECT_NAME_LENGTH}
      softLimit={LIMITS.MAX_PROJECT_NAME_LENGTH}
      value={name}
      onChangeText={(text) => {
        setName(text);
        if (error) {
          setError(null);
        }
      }}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      canSubmit={canSubmit}
      disabled={isSubmitting}
      error={error}
      isFocused={isFocused}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    />
  );
};
