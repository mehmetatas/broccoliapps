import { Checkbox, EditableText, IconButton, useDragAndDrop } from "@broccoliapps/browser";
import { LIMITS, type TaskDto, type TaskStatus } from "@broccoliapps/tasquito-shared";
import { Trash2 } from "lucide-preact";
import { useState } from "preact/hooks";
import { SubtaskItem } from "./SubtaskItem";

type SubtaskSectionProps = {
  subtasks: TaskDto[];
  isArchived: boolean;
  isDone: boolean;
  pendingSubtaskIds: Set<string>;
  addingSubtask: boolean;
  onAddingSubtaskChange: (adding: boolean) => void;
  onToggle: (subtaskId: string, status: TaskStatus) => void;
  onEditTitle: (subtaskId: string, title: string) => void;
  onDelete: (subtaskId: string) => void;
  onCreate: (title: string) => void;
  onReorder: (subtaskId: string, afterId: string | null, beforeId: string | null) => void;
};

export const SubtaskSection = ({
  subtasks,
  isArchived,
  isDone,
  pendingSubtaskIds,
  addingSubtask,
  onAddingSubtaskChange,
  onToggle,
  onEditTitle,
  onDelete,
  onCreate,
  onReorder,
}: SubtaskSectionProps) => {
  const [savingSubtaskIds, setSavingSubtaskIds] = useState<Set<string>>(new Set());

  const handleEditTitle = (subtaskId: string, title: string) => {
    setSavingSubtaskIds((prev) => new Set(prev).add(subtaskId));
    Promise.resolve(onEditTitle(subtaskId, title)).finally(() => {
      setSavingSubtaskIds((prev) => {
        const next = new Set(prev);
        next.delete(subtaskId);
        return next;
      });
    });
  };

  const todoSubtasks = subtasks.filter((st) => st.status === "todo");
  const doneSubtasks = subtasks.filter((st) => st.status === "done");

  const { containerRef } = useDragAndDrop({
    items: todoSubtasks,
    onReorder,
    disabled: isArchived || isDone,
  });

  if (subtasks.length === 0 && !addingSubtask) {
    return null;
  }

  return (
    <div class="mt-2 pl-7">
      {/* Todo subtasks + input + pending */}
      <div ref={containerRef}>
        {todoSubtasks.map((subtask) => (
          <SubtaskItem
            key={subtask.id}
            subtask={subtask}
            isArchived={isArchived}
            parentDone={isDone}
            saving={pendingSubtaskIds.has(subtask.id) || savingSubtaskIds.has(subtask.id)}
            onToggle={onToggle}
            onEditTitle={handleEditTitle}
            onDelete={onDelete}
          />
        ))}
        {addingSubtask && subtasks.length < LIMITS.MAX_SUBTASKS_PER_TASK && (
          <div class="flex items-start gap-2 py-1 group">
            <Checkbox checked={false} onChange={() => {}} disabled size="sm" class="mt-0.25" />
            <div class="flex-1 min-w-0">
              <EditableText
                value=""
                onSave={(title) => {
                  onCreate(title);
                  if (subtasks.length + 1 >= LIMITS.MAX_SUBTASKS_PER_TASK) {
                    onAddingSubtaskChange(false);
                  }
                }}
                placeholder="Subtask title"
                maxLength={LIMITS.MAX_SUBTASK_TITLE_LENGTH}
                textClassName="text-sm text-neutral-700 dark:text-neutral-300"
                className="text-sm"
                editRequested={addingSubtask}
                onEditEnded={() => onAddingSubtaskChange(false)}
                resetAfterSave
              />
            </div>
            <IconButton
              icon={<Trash2 size={14} />}
              aria-label="Cancel adding subtask"
              variant="danger"
              size="sm"
              onClick={() => onAddingSubtaskChange(false)}
              class="opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </div>
        )}
      </div>

      {/* Done subtasks */}
      {doneSubtasks.map((subtask) => (
        <SubtaskItem
          key={subtask.id}
          subtask={subtask}
          isArchived={isArchived}
          parentDone={isDone}
          saving={pendingSubtaskIds.has(subtask.id) || savingSubtaskIds.has(subtask.id)}
          onToggle={onToggle}
          onEditTitle={handleEditTitle}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};
