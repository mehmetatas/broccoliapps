import { useCallback } from "react";
import { useProjectContext } from "../context/ProjectContext";

export const useTask = (taskId: string) => {
  const ctx = useProjectContext();

  const updateStatus = useCallback(
    (status: "todo" | "done") => {
      ctx.updateTaskStatus(taskId, status);
    },
    [ctx, taskId],
  );

  const updateTitle = useCallback(
    (title: string) => {
      return ctx.updateTaskTitle(taskId, title);
    },
    [ctx, taskId],
  );

  const updateNote = useCallback(
    (note: string) => {
      return ctx.updateTaskNote(taskId, note);
    },
    [ctx, taskId],
  );

  const updateDueDate = useCallback(
    (date: string | undefined) => {
      ctx.updateTaskDueDate(taskId, date);
    },
    [ctx, taskId],
  );

  const remove = useCallback(() => {
    ctx.removeTask(taskId);
  }, [ctx, taskId]);

  const toggleSubtask = useCallback(
    (subtaskId: string) => {
      const task = ctx.tasks.find((t) => t.id === taskId);
      if (!task) {
        return;
      }
      const subtask = task.subtasks.find((st) => st.id === subtaskId);
      if (!subtask) {
        return;
      }
      const newStatus = subtask.status === "todo" ? "done" : "todo";
      ctx.updateSubtaskStatus(taskId, subtaskId, newStatus);
    },
    [ctx, taskId],
  );

  const updateSubtaskTitle = useCallback(
    (subtaskId: string, title: string) => {
      return ctx.updateSubtaskTitle(taskId, subtaskId, title);
    },
    [ctx, taskId],
  );

  const removeSubtask = useCallback(
    (subtaskId: string) => {
      ctx.removeSubtask(taskId, subtaskId);
    },
    [ctx, taskId],
  );

  const batchRemoveSubtasks = useCallback(
    (subtaskIds: string[]) => {
      ctx.batchRemoveSubtasks(taskId, subtaskIds);
    },
    [ctx, taskId],
  );

  const reorderSubtask = useCallback(
    (subtaskId: string, afterId: string | null, beforeId: string | null) => {
      ctx.reorderSubtask(taskId, subtaskId, afterId, beforeId);
    },
    [ctx, taskId],
  );

  const createSubtask = useCallback(
    (title: string) => {
      ctx.createSubtask(taskId, title);
    },
    [ctx, taskId],
  );

  return {
    updateStatus,
    updateTitle,
    updateNote,
    updateDueDate,
    remove,
    toggleSubtask,
    updateSubtaskTitle,
    removeSubtask,
    batchRemoveSubtasks,
    reorderSubtask,
    createSubtask,
  };
};
