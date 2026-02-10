import { Checkbox, DeleteConfirmModal, EditableText, IconButton, useDragAndDrop, useModal } from "@broccoliapps/browser";
import { LIMITS, type TaskDto, type TaskStatus } from "@broccoliapps/tasquito-shared";
import { ChevronRight, Trash2 } from "lucide-preact";
import { useEffect, useState } from "preact/hooks";
import { SubtaskItem } from "./SubtaskItem";

type SubtaskSectionProps = {
  subtasks: TaskDto[];
  isArchived: boolean;
  isDone: boolean;
  canAddSubtask: boolean;
  pendingSubtaskIds: Set<string>;
  addingSubtask: boolean;
  onAddingSubtaskChange: (adding: boolean) => void;
  onToggle: (subtaskId: string, status: TaskStatus) => void;
  onEditTitle: (subtaskId: string, title: string) => void;
  onDelete: (subtaskId: string) => void;
  onBatchDelete: (subtaskIds: string[]) => void;
  onCreate: (title: string) => void;
  onReorder: (subtaskId: string, afterId: string | null, beforeId: string | null) => void;
};

export const SubtaskSection = ({
  subtasks,
  isArchived,
  isDone,
  canAddSubtask,
  pendingSubtaskIds,
  addingSubtask,
  onAddingSubtaskChange,
  onToggle,
  onEditTitle,
  onDelete,
  onBatchDelete,
  onCreate,
  onReorder,
}: SubtaskSectionProps) => {
  const [savingSubtaskIds, setSavingSubtaskIds] = useState<Set<string>>(new Set());
  const [doneExpanded, setDoneExpanded] = useState(false);
  const deleteDoneModal = useModal();

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

  useEffect(() => {
    if (addingSubtask && !canAddSubtask) {
      onAddingSubtaskChange(false);
    }
  }, [addingSubtask, canAddSubtask, onAddingSubtaskChange]);

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
        {addingSubtask && canAddSubtask && (
          <div class="flex items-start gap-2 py-1 group">
            <Checkbox checked={false} onChange={() => {}} disabled size="sm" class="mt-0.25" />
            <div class="flex-1 min-w-0">
              <EditableText
                value=""
                onSave={(title) => {
                  onCreate(title);
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
      {doneSubtasks.length > 0 && (
        <div>
          <div class="flex items-center">
            <button
              type="button"
              onClick={() => setDoneExpanded((prev) => !prev)}
              class="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 py-0.5"
            >
              <ChevronRight size={14} class={`transition-transform ${doneExpanded ? "rotate-90" : ""}`} />
              Done ({doneSubtasks.length})
            </button>
            {doneExpanded && !isDone && (
              <button
                type="button"
                onClick={() => deleteDoneModal.open()}
                class="ml-auto flex items-center gap-1 p-0.5 text-xs text-neutral-400 hover:text-red-500 dark:text-neutral-500 dark:hover:text-red-400 transition-colors"
                aria-label="Delete all done subtasks"
              >
                <Trash2 size={12} />
                Delete All
              </button>
            )}
          </div>
          {doneExpanded &&
            doneSubtasks.map((subtask) => (
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
      )}

      <DeleteConfirmModal
        isOpen={deleteDoneModal.isOpen}
        onClose={deleteDoneModal.close}
        onConfirm={() => {
          onBatchDelete(doneSubtasks.map((st) => st.id));
          deleteDoneModal.close();
        }}
        title="Delete Done Subtasks"
        itemName={`${doneSubtasks.length} done subtask${doneSubtasks.length !== 1 ? "s" : ""}`}
      />
    </div>
  );
};
