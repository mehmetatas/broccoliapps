import { useCallback } from "react";
import { useProjectContext } from "../context/ProjectContext";

export const useSubtask = (taskId: string, subtaskId: string) => {
  const ctx = useProjectContext();

  const toggle = useCallback(() => {
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
  }, [ctx.tasks, ctx.updateSubtaskStatus, taskId, subtaskId]);

  const updateTitle = useCallback(
    (title: string) => {
      return ctx.updateSubtaskTitle(taskId, subtaskId, title);
    },
    [ctx.updateSubtaskTitle, taskId, subtaskId],
  );

  const remove = useCallback(() => {
    ctx.removeSubtask(taskId, subtaskId);
  }, [ctx.removeSubtask, taskId, subtaskId]);

  return { toggle, updateTitle, remove };
};
