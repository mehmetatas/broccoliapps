import { Input } from "@broccoliapps/browser";
import { LIMITS } from "@broccoliapps/tasquito-shared";
import { Plus } from "lucide-preact";
import { useState } from "preact/hooks";

type ProjectFormProps = {
  onSubmit: (name: string) => Promise<unknown>;
  disabled?: boolean;
};

export const ProjectForm = ({ onSubmit, disabled = false }: ProjectFormProps) => {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed || submitting || disabled) {
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(trimmed);
      setName("");
    } catch {
      // Error handled by parent hook
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div class="flex items-center gap-2">
      <Input
        placeholder="Create new project"
        value={name}
        onInput={(e) => setName((e.target as HTMLInputElement).value)}
        onKeyDown={handleKeyDown}
        maxLength={LIMITS.MAX_PROJECT_NAME_LENGTH}
        disabled={disabled || submitting}
      />
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!name.trim() || submitting || disabled}
        class="p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
      >
        <Plus size={20} />
      </button>
    </div>
  );
};
