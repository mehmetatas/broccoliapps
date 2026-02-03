import { Card, Checkbox, EditableText, Skeleton } from "@broccoliapps/browser";
import { LIMITS, type TaskDto, type TaskStatus } from "@broccoliapps/tasquito-shared";
import autoAnimate, { type AnimationController } from "@formkit/auto-animate";
import { Calendar, ChevronDown, ChevronRight, Pencil, Trash2, X } from "lucide-preact";
import { useEffect, useRef, useState } from "preact/hooks";
import Sortable from "sortablejs";

type TaskWithSubtasks = TaskDto & {
  subtasks: TaskDto[];
};

type TaskCardProps = {
  task: TaskWithSubtasks;
  onToggleStatus: (status: TaskStatus) => Promise<void> | void;
  onUpdateTitle: (title: string) => void;
  onUpdateDescription: (description: string) => void;
  onUpdateDueDate: (dueDate: string | undefined) => void;
  onDelete: () => void;
  onSubtaskToggleStatus: (subtaskId: string, status: TaskStatus) => Promise<void> | void;
  onSubtaskUpdateTitle: (subtaskId: string, title: string) => void;
  onSubtaskDelete: (subtaskId: string) => void;
  onSubtaskAdd: (title: string) => void;
  onSubtaskReorder?: (subtaskId: string, afterId: string | null, beforeId: string | null) => void;
  disabled?: boolean;
  pendingSubtaskCount?: number;
};

const formatDate = (dateStr: string): string => {
  const [year, month, day] = dateStr.split("-");
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  const now = new Date();
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
};

export const TaskCard = ({
  task,
  onToggleStatus,
  onUpdateTitle,
  onUpdateDescription,
  onUpdateDueDate,
  onDelete,
  onSubtaskToggleStatus,
  onSubtaskUpdateTitle,
  onSubtaskDelete,
  onSubtaskAdd,
  onSubtaskReorder,
  disabled = false,
  pendingSubtaskCount = 0,
}: TaskCardProps) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [isTogglingTask, setIsTogglingTask] = useState(false);
  const [togglingSubtasks, setTogglingSubtasks] = useState<Set<string>>(new Set());
  const [showDoneSubtasks, setShowDoneSubtasks] = useState(false);
  const isDone = task.status === "done";

  // Split subtasks into todo and done, sorted by sortOrder
  const sortBySortOrder = (a: TaskDto, b: TaskDto) => {
    const aOrder = a.sortOrder ?? "";
    const bOrder = b.sortOrder ?? "";
    return aOrder < bOrder ? -1 : aOrder > bOrder ? 1 : 0;
  };
  const todoSubtasks = task.subtasks.filter((st) => st.status !== "done").sort(sortBySortOrder);
  const doneSubtasks = task.subtasks.filter((st) => st.status === "done").sort(sortBySortOrder);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const subtasksContainerRef = useRef<HTMLDivElement>(null);
  const subtaskSortableRef = useRef<Sortable | null>(null);
  const subtaskAnimateRef = useRef<AnimationController | null>(null);

  // Subtask drag and drop with SortableJS
  useEffect(() => {
    const container = subtasksContainerRef.current;
    if (!container || !onSubtaskReorder || disabled || isDone) {
      return;
    }

    if (subtaskSortableRef.current) {
      subtaskSortableRef.current.destroy();
    }

    subtaskSortableRef.current = Sortable.create(container, {
      filter: "input, textarea, button, [contenteditable], .no-drag",
      preventOnFilter: false,
      onFilter: () => {
        // Filter matched - drag is cancelled automatically
        // Do nothing here to allow default browser behavior (focus)
      },
      forceFallback: true,
      animation: 150,
      ghostClass: "opacity-30",
      chosenClass: "shadow-lg",
      onStart: () => {
        subtaskAnimateRef.current?.disable();
      },
      onEnd: (evt) => {
        subtaskAnimateRef.current?.enable();
        const { oldIndex, newIndex, item: draggedEl } = evt;
        if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) {
          return;
        }

        const draggedId = draggedEl.getAttribute("data-drag-id");
        if (!draggedId) {
          return;
        }

        // After SortableJS moves the element, the DOM is in the new order
        // Query the DOM directly to find neighbors
        const elements = Array.from(container.querySelectorAll("[data-drag-id]"));
        const draggedIndex = elements.findIndex((el) => el.getAttribute("data-drag-id") === draggedId);

        if (draggedIndex === -1) {
          return;
        }

        const prevEl = elements[draggedIndex - 1];
        const nextEl = elements[draggedIndex + 1];

        const afterId = prevEl?.getAttribute("data-drag-id") ?? null;
        const beforeId = nextEl?.getAttribute("data-drag-id") ?? null;

        onSubtaskReorder(draggedId, afterId, beforeId);
      },
    });

    return () => {
      if (subtaskSortableRef.current) {
        subtaskSortableRef.current.destroy();
        subtaskSortableRef.current = null;
      }
    };
  }, [onSubtaskReorder, disabled, isDone]);

  // Auto-animate for todo subtasks (imperative - shares ref with SortableJS)
  useEffect(() => {
    const el = subtasksContainerRef.current;
    if (el) {
      if (!subtaskAnimateRef.current || subtaskAnimateRef.current.parent !== el) {
        subtaskAnimateRef.current?.destroy?.();
        subtaskAnimateRef.current = autoAnimate(el, {
          duration: 150,
          easing: "ease-out",
          disrespectUserMotionPreference: true,
        });
      }
    } else if (subtaskAnimateRef.current) {
      subtaskAnimateRef.current.destroy?.();
      subtaskAnimateRef.current = null;
    }
  });

  // Auto-animate for done subtasks (imperative - container is conditionally rendered)
  const doneSubtasksRef = useRef<HTMLDivElement>(null);
  const doneSubtaskAnimateRef = useRef<AnimationController | null>(null);

  useEffect(() => {
    const el = doneSubtasksRef.current;
    if (el) {
      if (!doneSubtaskAnimateRef.current || doneSubtaskAnimateRef.current.parent !== el) {
        doneSubtaskAnimateRef.current?.destroy?.();
        doneSubtaskAnimateRef.current = autoAnimate(el, {
          duration: 150,
          easing: "ease-out",
          disrespectUserMotionPreference: true,
        });
      }
    } else if (doneSubtaskAnimateRef.current) {
      doneSubtaskAnimateRef.current.destroy?.();
      doneSubtaskAnimateRef.current = null;
    }
  });

  const handleToggleStatus = async (checked: boolean) => {
    setIsTogglingTask(true);
    try {
      await onToggleStatus(checked ? "done" : "todo");
    } finally {
      setIsTogglingTask(false);
    }
  };

  const handleSubtaskToggleStatus = async (subtaskId: string, checked: boolean) => {
    setTogglingSubtasks((prev) => new Set(prev).add(subtaskId));
    try {
      await onSubtaskToggleStatus(subtaskId, checked ? "done" : "todo");
    } finally {
      setTogglingSubtasks((prev) => {
        const next = new Set(prev);
        next.delete(subtaskId);
        return next;
      });
    }
  };

  const handleDateClick = () => {
    dateInputRef.current?.showPicker();
  };

  const handleDateChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    onUpdateDueDate(input.value || undefined);
  };

  const handleAddSubtask = () => {
    if (newSubtaskTitle.trim()) {
      onSubtaskAdd(newSubtaskTitle.trim());
      setNewSubtaskTitle("");
    }
  };

  const handleSubtaskKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSubtask();
    }
  };

  return (
    <Card
      class={`group transition-[color,background-color,border-color,box-shadow,opacity] duration-150 ${disabled || isDone ? "" : "cursor-grab active:cursor-grabbing"}`}
      data-drag-id={task.id}
    >
      {/* Header: Checkbox + Title + Date + Edit + Delete */}
      <div class="flex items-center gap-2">
        <Checkbox checked={isDone} onChange={handleToggleStatus} disabled={disabled} loading={isTogglingTask} strikethrough={false} />
        <div class="flex-1 min-w-0 flex items-center gap-2">
          <EditableText
            value={task.title}
            onSave={onUpdateTitle}
            disabled={disabled || isDone}
            maxLength={LIMITS.MAX_TASK_TITLE_LENGTH}
            textClassName={`text-lg font-medium ${isDone ? "line-through text-neutral-400 dark:text-neutral-500" : "text-neutral-900 dark:text-neutral-100"}`}
          />
          {(task.subtasks.length > 0 || pendingSubtaskCount > 0) && (
            <span class="text-xs text-neutral-400 dark:text-neutral-500">
              ({doneSubtasks.length}/{task.subtasks.length + pendingSubtaskCount})
            </span>
          )}
        </div>
        {/* Date badge - only show if has date or in edit mode */}
        {(task.dueDate || isEditMode) && (
          <div class="relative">
            <button
              type="button"
              onClick={handleDateClick}
              disabled={disabled}
              class={`flex items-center gap-1 px-2 py-0.5 text-base rounded-full
                ${
                  task.dueDate
                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                    : "text-neutral-400 dark:text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                } disabled:opacity-50`}
            >
              <Calendar size={12} />
              <span class="text-sm">{task.dueDate ? formatDate(task.dueDate) : "No date"}</span>
            </button>
            <input
              ref={dateInputRef}
              type="date"
              value={task.dueDate ?? ""}
              onChange={handleDateChange}
              class="absolute bottom-0 left-0 opacity-0 w-0 h-0"
              tabIndex={-1}
            />
          </div>
        )}
        {/* Delete button - in edit mode for non-done tasks, on hover for done tasks */}
        {!disabled && (isEditMode || isDone) && (
          <button
            type="button"
            onClick={onDelete}
            class={`p-1 text-neutral-400 dark:text-neutral-500 hover:text-red-500 dark:hover:text-red-400 ${isDone && !isEditMode ? "transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100" : ""}`}
          >
            <Trash2 size={18} />
          </button>
        )}
        {/* Edit toggle - hidden when disabled or done, hover-only on desktop when not in edit mode */}
        {!disabled && !isDone && (
          <button
            type="button"
            onClick={() => setIsEditMode(!isEditMode)}
            class={`p-1 rounded transition-opacity ${isEditMode ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" : "text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100"}`}
          >
            <Pencil size={16} />
          </button>
        )}
      </div>

      {/* Description - view mode: only show if exists, edit mode: always show */}
      {(isEditMode || task.description) && (
        <div class="mt-1">
          <EditableText
            value={task.description ?? ""}
            onSave={onUpdateDescription}
            placeholder={isEditMode ? "Add description..." : undefined}
            disabled={disabled}
            multiline
            maxLength={LIMITS.MAX_TASK_DESCRIPTION_LENGTH}
            textClassName="text-base text-neutral-500 dark:text-neutral-400 line-clamp-2"
          />
        </div>
      )}

      {/* Subtasks - Todo */}
      {(todoSubtasks.length > 0 || pendingSubtaskCount > 0) && (
        <div ref={subtasksContainerRef} class="mt-2 space-y-0.5">
          {todoSubtasks.map((subtask) => (
            <div
              key={subtask.id}
              class={`group/subtask flex items-center gap-2 pl-4 py-0.5 rounded transition-[color,background-color,border-color,box-shadow,opacity] duration-150 ${onSubtaskReorder && !disabled && !isDone ? "cursor-grab active:cursor-grabbing" : ""}`}
              data-drag-id={subtask.id}
            >
              <Checkbox
                checked={false}
                onChange={(checked) => handleSubtaskToggleStatus(subtask.id, checked)}
                disabled={disabled || isDone}
                loading={togglingSubtasks.has(subtask.id)}
                size="sm"
              />
              <div class="flex-1 min-w-0">
                <EditableText
                  value={subtask.title}
                  onSave={(title) => onSubtaskUpdateTitle(subtask.id, title)}
                  disabled={disabled || isDone}
                  maxLength={LIMITS.MAX_SUBTASK_TITLE_LENGTH}
                  textClassName="text-base text-neutral-600 dark:text-neutral-300"
                />
              </div>
              {/* Subtask delete button - hidden when disabled or parent is done, hover-only on desktop */}
              {!disabled && !isDone && (
                <button
                  type="button"
                  onClick={() => onSubtaskDelete(subtask.id)}
                  class="p-0.5 text-neutral-300 dark:text-neutral-600 hover:text-neutral-500 dark:hover:text-neutral-400 transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/subtask:opacity-100"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
          {/* Pending subtask skeletons */}
          {Array.from({ length: pendingSubtaskCount }).map((_, i) => (
            <div key={`pending-${i}`} class="flex items-center gap-2 pl-4 py-0.5">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 flex-1 max-w-[200px]" />
            </div>
          ))}
        </div>
      )}

      {/* Subtasks - Done */}
      {doneSubtasks.length > 0 && (
        <div class={todoSubtasks.length > 0 ? "mt-1" : "mt-2"}>
          <button
            type="button"
            onClick={() => setShowDoneSubtasks(!showDoneSubtasks)}
            class="flex items-center gap-1 text-xs text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
          >
            {showDoneSubtasks ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span>Done ({doneSubtasks.length})</span>
          </button>
          {showDoneSubtasks && (
            <div ref={doneSubtasksRef} class="mt-1 space-y-0.5">
              {doneSubtasks.map((subtask) => (
                <div key={subtask.id} class="group/subtask flex items-center gap-2 pl-4 py-0.5 rounded">
                  <Checkbox
                    checked={true}
                    onChange={(checked) => handleSubtaskToggleStatus(subtask.id, checked)}
                    disabled={disabled || isDone}
                    loading={togglingSubtasks.has(subtask.id)}
                    size="sm"
                  />
                  <div class="flex-1 min-w-0">
                    <EditableText
                      value={subtask.title}
                      onSave={(title) => onSubtaskUpdateTitle(subtask.id, title)}
                      disabled={disabled || isDone}
                      maxLength={LIMITS.MAX_SUBTASK_TITLE_LENGTH}
                      textClassName="text-base line-through text-neutral-400 dark:text-neutral-500"
                    />
                  </div>
                  {/* Subtask delete button - hidden when disabled or parent is done, hover-only on desktop */}
                  {!disabled && !isDone && (
                    <button
                      type="button"
                      onClick={() => onSubtaskDelete(subtask.id)}
                      class="p-0.5 text-neutral-300 dark:text-neutral-600 hover:text-neutral-500 dark:hover:text-neutral-400 transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/subtask:opacity-100"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add subtask form - only in edit mode */}
      {isEditMode &&
        (task.subtasks.length >= LIMITS.MAX_SUBTASKS_PER_TASK ? (
          <p class="mt-2 text-xs text-neutral-500 dark:text-neutral-400 italic">
            If a task needs more than {LIMITS.MAX_SUBTASKS_PER_TASK} subtasks, consider breaking it into smaller tasks. To add more, delete old ones first.
          </p>
        ) : (
          <div class="no-drag mt-2 flex items-center gap-2">
            <input
              id="add-subtask-input"
              name="subtask-title"
              type="text"
              placeholder="Add subtask..."
              value={newSubtaskTitle}
              maxLength={LIMITS.MAX_SUBTASK_TITLE_LENGTH}
              onInput={(e) => setNewSubtaskTitle((e.target as HTMLInputElement).value)}
              onKeyDown={handleSubtaskKeyDown}
              disabled={disabled}
              class="no-drag flex-1 text-base px-2 py-1 border border-neutral-200 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-blue-400 dark:focus:border-blue-500"
            />
            <button
              type="button"
              onClick={handleAddSubtask}
              disabled={disabled || !newSubtaskTitle.trim()}
              class="text-base px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>
        ))}
    </Card>
  );
};
