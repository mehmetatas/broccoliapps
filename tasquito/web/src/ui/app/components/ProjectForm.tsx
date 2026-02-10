import { EditableText } from "@broccoliapps/browser";
import { LIMITS } from "@broccoliapps/tasquito-shared";

type ProjectFormProps = {
  onSubmit: (name: string) => Promise<unknown>;
  disabled?: boolean;
};

export const ProjectForm = ({ onSubmit, disabled = false }: ProjectFormProps) => {
  return (
    <EditableText
      value=""
      placeholder="Create new project"
      maxLength={LIMITS.MAX_PROJECT_NAME_LENGTH}
      resetAfterSave
      disabled={disabled}
      onSave={(name) => onSubmit(name)}
    />
  );
};
