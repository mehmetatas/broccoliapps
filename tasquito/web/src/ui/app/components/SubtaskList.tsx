import { Plus, Trash2 } from "lucide-preact";
import { useState } from "preact/hooks";
import { LIMITS, type TaskDto, type TaskStatus } from "@broccoliapps/tasquito-shared";
import { Button, Checkbox, EditableText, IconButton, Input } from "@broccoliapps/browser";

type SubtaskListProps = {
  subtasks: TaskDto[];
  onToggleStatus: (subtaskId: string, status: TaskStatus) => void;
  onUpdateTitle: (subtaskId: string, title: string) => void;
  onDelete: (subtaskId: string) => void;
  onAdd: (title: string) => void;
  disabled?: boolean;
};

export const SubtaskList = ({
  subtasks,
  onToggleStatus,
  onUpdateTitle,
  onDelete,
  onAdd,
  disabled = false,
}: SubtaskListProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  const handleAdd = () => {
    if (newSubtaskTitle.trim()) {
      onAdd(newSubtaskTitle.trim());
      setNewSubtaskTitle("");
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    } else if (e.key === "Escape") {
      setNewSubtaskTitle("");
      setIsAdding(false);
    }
  };

  return (
    <div class="space-y-2">
      {subtasks.map((subtask) => (
        <div key={subtask.id} class="flex items-center gap-2 group">
          <Checkbox
            checked={subtask.status === "done"}
            onChange={(checked) => onToggleStatus(subtask.id, checked ? "done" : "todo")}
            disabled={disabled}
          />
          <div class="flex-1 min-w-0">
            <EditableText
              value={subtask.title}
              onSave={(title) => onUpdateTitle(subtask.id, title)}
              disabled={disabled}
              maxLength={LIMITS.MAX_SUBTASK_TITLE_LENGTH}
              textClassName={subtask.status === "done" ? "line-through text-neutral-400" : "text-neutral-700"}
            />
          </div>
          <IconButton
            icon={<Trash2 size={16} />}
            variant="danger"
            size="sm"
            aria-label="Delete subtask"
            onClick={() => onDelete(subtask.id)}
            disabled={disabled}
            class="opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </div>
      ))}

      {isAdding ? (
        <div class="flex items-center gap-2 pl-7">
          <div class="flex-1">
            <Input
              type="text"
              placeholder="Subtask title"
              value={newSubtaskTitle}
              maxLength={LIMITS.MAX_SUBTASK_TITLE_LENGTH}
              onInput={(e) => setNewSubtaskTitle((e.target as HTMLInputElement).value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>
          <Button size="sm" onClick={handleAdd} disabled={!newSubtaskTitle.trim()}>
            Add
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setIsAdding(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          disabled={disabled}
          class="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 pl-7 py-1 disabled:opacity-50"
        >
          <Plus size={16} />
          <span>Add subtask</span>
        </button>
      )}
    </div>
  );
};
