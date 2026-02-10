import { Checkbox, DatePicker, DeleteConfirmModal, DropdownMenu, EditableText, IconButton } from "@broccoliapps/browser";
import { formatDueDate, LIMITS, type TaskDto } from "@broccoliapps/tasquito-shared";
import { MoreHorizontal, Trash2 } from "lucide-preact";
import { useState } from "preact/hooks";
import { useTask } from "../hooks/useTask";
import { useTaskCardState } from "../hooks/useTaskCardState";
import { SubtaskSection } from "./SubtaskSection";
import { TaskNote } from "./TaskNote";

type TaskCardProps = {
  task: TaskDto & { subtasks: TaskDto[] };
  isArchived: boolean;
  pending?: boolean;
  pendingSubtaskIds: Set<string>;
};

export const TaskCard = ({ task, isArchived, pending, pendingSubtaskIds }: TaskCardProps) => {
  const {
    updateStatus,
    updateTitle,
    updateNote,
    updateDueDate,
    remove,
    toggleSubtask,
    updateSubtaskTitle,
    removeSubtask,
    batchRemoveSubtasks,
    createSubtask,
    reorderSubtask,
  } = useTask(task.id);
  const [savingTitle, setSavingTitle] = useState(false);

  const handleSaveTitle = (title: string) => {
    setSavingTitle(true);
    Promise.resolve(updateTitle(title)).finally(() => setSavingTitle(false));
  };

  const state = useTaskCardState({ task, isArchived, updateDueDate, remove });
  const loading = pending || savingTitle;

  return (
    <div data-drag-id={task.id} class={`py-4 px-2 border-b border-neutral-200 dark:border-neutral-700${state.isDone ? " group" : ""}`}>
      {/* Header row */}
      <div class="flex items-start gap-2">
        <Checkbox checked={state.isDone} onChange={() => updateStatus(state.isDone ? "todo" : "done")} disabled={isArchived || loading} loading={loading} />
        <div class="flex-1 min-w-0">
          <EditableText
            value={task.title}
            onSave={handleSaveTitle}
            disabled={isArchived || state.isDone || pending}
            maxLength={LIMITS.MAX_TASK_TITLE_LENGTH}
            textClassName={state.isDone ? "line-through text-neutral-400 dark:text-neutral-500" : "text-neutral-900 dark:text-neutral-100"}
          />
        </div>

        {/* Due date badge */}
        {task.dueDate && (
          <div class="relative shrink-0">
            <button
              type="button"
              onClick={() => state.capabilities.canEditDueDate && state.setShowDatePicker(true)}
              disabled={!state.capabilities.canEditDueDate}
              class="shrink-0 bg-blue-500 text-white text-xs font-semibold px-1.5 py-0.5 rounded disabled:opacity-50"
            >
              {formatDueDate(task.dueDate)}
            </button>
            <DatePicker value={task.dueDate} onChange={(v) => updateDueDate(v)} isOpen={state.showDatePicker} onClose={() => state.setShowDatePicker(false)} />
          </div>
        )}

        {/* Actions */}
        {state.isDone && state.capabilities.canDelete ? (
          <IconButton
            icon={<Trash2 size={16} />}
            aria-label="Delete task"
            variant="danger"
            size="sm"
            onClick={remove}
            class="opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity"
          />
        ) : (
          state.menuItems.length > 0 && (
            <div class="relative shrink-0">
              <IconButton icon={<MoreHorizontal size={16} />} aria-label="Task actions" size="sm" onClick={() => state.setShowMenu(!state.showMenu)} />
              <DropdownMenu items={state.menuItems} isOpen={state.showMenu} onClose={() => state.setShowMenu(false)} />
              {!task.dueDate && (
                <DatePicker
                  value={task.dueDate}
                  onChange={(v) => updateDueDate(v)}
                  isOpen={state.showDatePicker}
                  onClose={() => state.setShowDatePicker(false)}
                />
              )}
            </div>
          )
        )}
      </div>

      {/* Subtask section */}
      <SubtaskSection
        subtasks={task.subtasks}
        isArchived={isArchived}
        isDone={state.isDone}
        canAddSubtask={state.capabilities.canAddSubtask}
        pendingSubtaskIds={pendingSubtaskIds}
        addingSubtask={state.subtaskAddRequested}
        onAddingSubtaskChange={state.setSubtaskAddRequested}
        onToggle={toggleSubtask}
        onEditTitle={updateSubtaskTitle}
        onDelete={removeSubtask}
        onBatchDelete={batchRemoveSubtasks}
        onCreate={createSubtask}
        onReorder={reorderSubtask}
      />

      {/* Note section */}
      <TaskNote
        note={task.note}
        isArchived={isArchived}
        isDone={state.isDone}
        editRequested={state.noteEditRequested}
        onEditStarted={() => state.setNoteEditRequested(false)}
        onSave={updateNote}
      />

      <DeleteConfirmModal
        isOpen={state.deleteModal.isOpen}
        onClose={state.deleteModal.close}
        onConfirm={() => {
          remove();
          state.deleteModal.close();
        }}
        title="Delete Task"
        itemName={task.title}
      />
    </div>
  );
};
