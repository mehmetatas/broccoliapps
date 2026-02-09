import { Checkbox, DeleteConfirmModal, EditableText, IconButton, useModal } from "@broccoliapps/browser";
import { LIMITS, type TaskDto, type TaskStatus } from "@broccoliapps/tasquito-shared";
import { Trash2 } from "lucide-preact";

type SubtaskItemProps = {
  subtask: TaskDto;
  isArchived: boolean;
  parentDone: boolean;
  saving?: boolean;
  onToggle: (subtaskId: string, status: TaskStatus) => void;
  onEditTitle: (subtaskId: string, title: string) => void;
  onDelete: (subtaskId: string) => void;
};

export const SubtaskItem = ({ subtask, isArchived, parentDone, saving, onToggle, onEditTitle, onDelete }: SubtaskItemProps) => {
  const isDone = subtask.status === "done";
  const disabled = isArchived || isDone || parentDone;
  const deleteModal = useModal();

  return (
    <div data-drag-id={subtask.id} class="flex items-start gap-2 py-1 group">
      <Checkbox
        checked={isDone}
        onChange={() => onToggle(subtask.id, isDone ? "todo" : "done")}
        disabled={isArchived || parentDone}
        loading={saving}
        size="sm"
        class="mt-0.25"
      />
      <div class="flex-1 min-w-0">
        <EditableText
          value={subtask.title}
          onSave={(title) => onEditTitle(subtask.id, title)}
          disabled={disabled}
          maxLength={LIMITS.MAX_SUBTASK_TITLE_LENGTH}
          textClassName={isDone ? "text-sm line-through text-neutral-400 dark:text-neutral-500" : "text-sm text-neutral-700 dark:text-neutral-300"}
          className="text-sm"
        />
      </div>
      {!isArchived && !parentDone && (
        <IconButton
          icon={<Trash2 size={14} />}
          aria-label="Delete subtask"
          variant="danger"
          size="sm"
          onClick={() => {
            if (isDone) {
              onDelete(subtask.id);
            } else {
              deleteModal.open();
            }
          }}
          class="opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity"
        />
      )}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={() => {
          onDelete(subtask.id);
          deleteModal.close();
        }}
        title="Delete Subtask"
        itemName={subtask.title}
      />
    </div>
  );
};
