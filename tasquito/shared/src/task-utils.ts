import type { TaskDto } from "./api";
import { LIMITS } from "./limits";

// --- Capabilities ---

export type TaskCapabilities = {
  isDone: boolean;
  canEditTitle: boolean;
  canEditDueDate: boolean;
  canEditNote: boolean;
  canAddSubtask: boolean;
  canDelete: boolean;
};

export const getTaskCapabilities = (task: TaskDto & { subtasks: TaskDto[] }, isArchived: boolean): TaskCapabilities => {
  const isDone = task.status === "done";
  const canEdit = !isArchived && !isDone;
  return {
    isDone,
    canEditTitle: canEdit,
    canEditDueDate: canEdit,
    canEditNote: canEdit,
    canAddSubtask:
      canEdit &&
      task.subtasks.length < LIMITS.MAX_SUBTASKS_PER_TASK &&
      task.subtasks.filter((st) => st.status === "todo").length < LIMITS.MAX_OPEN_SUBTASKS_PER_TASK,
    canDelete: !isArchived,
  };
};

// --- Menu Items ---

export type TaskMenuAction = "add-subtask" | "due-date" | "add-note" | "delete";

export const getTaskMenuActions = (task: TaskDto, capabilities: TaskCapabilities): TaskMenuAction[] => {
  const actions: TaskMenuAction[] = [];
  if (capabilities.canAddSubtask) {
    actions.push("add-subtask");
  }
  if (capabilities.canEditDueDate && !task.dueDate) {
    actions.push("due-date");
  }
  if (!task.note && capabilities.canEditNote) {
    actions.push("add-note");
  }
  if (capabilities.canDelete) {
    actions.push("delete");
  }
  return actions;
};

// --- Date Formatting ---

export const formatDueDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};
