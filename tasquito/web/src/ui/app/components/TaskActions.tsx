import { Pencil, Trash2 } from "lucide-preact";

type TaskActionsProps = {
  onEdit: () => void;
  onDelete: () => void;
};

export const TaskActions = ({ onEdit, onDelete }: TaskActionsProps) => {
  return (
    <div class="flex items-center gap-2">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        class="p-1.5 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors"
        title="Edit task"
      >
        <Pencil size={16} />
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        class="p-1.5 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
        title="Delete task"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
};
