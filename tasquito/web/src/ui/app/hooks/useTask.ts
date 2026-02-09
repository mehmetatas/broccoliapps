import { useCallback } from "preact/hooks";
import { useProjectContext } from "../context/ProjectContext";

export const useTask = (taskId: string) => {
  const ctx = useProjectContext();

  const updateStatus = useCallback(
    (status: "todo" | "done") => {
      ctx.updateTaskStatus(taskId, status);
    },
    [ctx.updateTaskStatus, taskId],
  );

  const updateTitle = useCallback(
    (title: string) => {
      return ctx.updateTaskTitle(taskId, title);
    },
    [ctx.updateTaskTitle, taskId],
  );

  const updateNote = useCallback(
    (note: string) => {
      return ctx.updateTaskNote(taskId, note);
    },
    [ctx.updateTaskNote, taskId],
  );

  const updateDueDate = useCallback(
    (date: string | undefined) => {
      ctx.updateTaskDueDate(taskId, date);
    },
    [ctx.updateTaskDueDate, taskId],
  );

  const remove = useCallback(() => {
    ctx.removeTask(taskId);
  }, [ctx.removeTask, taskId]);

  const toggleSubtask = useCallback(
    (subtaskId: string, status: "todo" | "done") => {
      ctx.updateSubtaskStatus(taskId, subtaskId, status);
    },
    [ctx.updateSubtaskStatus, taskId],
  );

  const updateSubtaskTitle = useCallback(
    (subtaskId: string, title: string) => {
      return ctx.updateSubtaskTitle(taskId, subtaskId, title);
    },
    [ctx.updateSubtaskTitle, taskId],
  );

  const removeSubtask = useCallback(
    (subtaskId: string) => {
      ctx.removeSubtask(taskId, subtaskId);
    },
    [ctx.removeSubtask, taskId],
  );

  const reorderSubtask = useCallback(
    (subtaskId: string, afterId: string | null, beforeId: string | null) => {
      ctx.reorderSubtask(taskId, subtaskId, afterId, beforeId);
    },
    [ctx.reorderSubtask, taskId],
  );

  const createSubtask = useCallback(
    (title: string) => {
      ctx.createSubtask(taskId, title);
    },
    [ctx.createSubtask, taskId],
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
    reorderSubtask,
    createSubtask,
  };
};
