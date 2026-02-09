import { LIMITS } from "@broccoliapps/tasquito-shared";
import { useEffect, useRef, useState } from "react";
import { Keyboard, TextInput } from "react-native";
import { InlineForm } from "./InlineForm";

export type TaskFormData = {
  title: string;
};

type Props = {
  onSubmit: (data: TaskFormData) => void;
  autoFocus?: boolean;
};

export const TaskForm = ({ onSubmit, autoFocus }: Props) => {
  const [title, setTitle] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  const trimmed = title.trim();
  const canSubmit = trimmed.length > 0;

  const handleSubmit = () => {
    if (!trimmed || trimmed.length > LIMITS.MAX_TASK_TITLE_LENGTH) {
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
    <InlineForm
      placeholder="Create new task"
      maxLength={LIMITS.MAX_TASK_TITLE_LENGTH}
      softLimit={LIMITS.MAX_TASK_TITLE_LENGTH}
      value={title}
      onChangeText={setTitle}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      canSubmit={canSubmit}
      isFocused={isFocused}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      inputRef={inputRef}
      submitBehavior="submit"
    />
  );
};
