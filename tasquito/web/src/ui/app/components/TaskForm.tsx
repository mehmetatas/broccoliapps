import { Input } from "@broccoliapps/browser";
import { LIMITS } from "@broccoliapps/tasquito-shared";
import { Plus } from "lucide-preact";
import { useState } from "preact/hooks";

type TaskFormProps = {
  onSubmit: (data: { title: string }) => void;
  disabled?: boolean;
};

export const TaskForm = ({ onSubmit, disabled = false }: TaskFormProps) => {
  const [title, setTitle] = useState("");

  const handleSubmit = () => {
    const trimmed = title.trim();
    if (!trimmed || disabled) {
      return;
    }
    onSubmit({ title: trimmed });
    setTitle("");
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
        placeholder="Create new task"
        value={title}
        onInput={(e) => setTitle((e.target as HTMLInputElement).value)}
        onKeyDown={handleKeyDown}
        maxLength={LIMITS.MAX_TASK_TITLE_LENGTH}
        disabled={disabled}
      />
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!title.trim() || disabled}
        class="p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
      >
        <Plus size={20} />
      </button>
    </div>
  );
};
