import { EditableText } from "@broccoliapps/browser";
import { LIMITS } from "@broccoliapps/tasquito-shared";

type TaskFormProps = {
  onSubmit: (data: { title: string }) => void;
  disabled?: boolean;
};

export const TaskForm = ({ onSubmit, disabled = false }: TaskFormProps) => {
  return (
    <EditableText
      value=""
      placeholder="Create new task"
      maxLength={LIMITS.MAX_TASK_TITLE_LENGTH}
      resetAfterSave
      disabled={disabled}
      onSave={(title) => onSubmit({ title })}
    />
  );
};
