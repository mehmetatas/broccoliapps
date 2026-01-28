import { useEffect, useState } from "preact/hooks";
import { generateKeyBetween } from "fractional-indexing";
import type { ProjectWithTasksDto, TaskDto, TaskStatus } from "@broccoliapps/tasquito-shared";
import { archiveProject, deleteProject, deleteTask, getProject, patchProject, patchTask, postSubtask, postTask, unarchiveProject } from "../api";

type TaskWithSubtasks = TaskDto & { subtasks: TaskDto[] };

export const useProject = (id: string) => {
  const [project, setProject] = useState<ProjectWithTasksDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingTaskCount, setPendingTaskCount] = useState(0);
  const [pendingSubtaskCounts, setPendingSubtaskCounts] = useState<Map<string, number>>(new Map());

  const load = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getProject(id);
      setProject(data.project);
    } catch (err) {
      setError("Failed to load project");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  // Project actions
  const updateName = async (name: string) => {
    if (!project) return;
    await patchProject({ id: project.id, name });
    setProject((prev) => (prev ? { ...prev, name } : null));
  };

  const remove = async () => {
    if (!project) return;
    await deleteProject(project.id);
  };

  const archive = async () => {
    if (!project) return;
    await archiveProject(project.id);
  };

  const unarchive = async () => {
    if (!project) return;
    await unarchiveProject(project.id);
    await load();
  };

  // Task actions
  const createTask = (data: { title: string; description?: string; dueDate?: string; subtasks?: string[] }) => {
    if (!project) return;

    // Show skeleton immediately
    setPendingTaskCount((c) => c + 1);

    // Fire API call in background
    postTask({
      projectId: project.id,
      title: data.title,
      description: data.description,
      dueDate: data.dueDate,
      subtasks: data.subtasks,
    })
      .then((result) => {
        // Add the real task to the top
        setProject((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            tasks: [{ ...result.task, subtasks: result.subtasks ?? [] }, ...prev.tasks],
          };
        });
      })
      .catch((err) => {
        console.error("Failed to create task", err);
      })
      .finally(() => {
        setPendingTaskCount((c) => c - 1);
      });
  };

  const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
    if (!project) return;
    await patchTask({ projectId: project.id, id: taskId, status });
    setProject((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, status } : t)),
      };
    });
  };

  const updateTaskTitle = async (taskId: string, title: string) => {
    if (!project) return;
    await patchTask({ projectId: project.id, id: taskId, title });
    setProject((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, title } : t)),
      };
    });
  };

  const updateTaskDescription = async (taskId: string, description: string) => {
    if (!project) return;
    await patchTask({ projectId: project.id, id: taskId, description });
    setProject((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, description } : t)),
      };
    });
  };

  const updateTaskDueDate = async (taskId: string, dueDate: string | undefined) => {
    if (!project) return;
    await patchTask({ projectId: project.id, id: taskId, dueDate: dueDate ?? null });
    setProject((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, dueDate } : t)),
      };
    });
  };

  const removeTask = (taskId: string) => {
    if (!project) return;

    // Find the task to save for potential restoration
    const taskToDelete = project.tasks.find((t) => t.id === taskId);
    if (!taskToDelete) return;

    // Optimistic update - remove immediately
    setProject((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        tasks: prev.tasks.filter((t) => t.id !== taskId),
      };
    });

    // Call API in background
    deleteTask(project.id, taskId).catch((err) => {
      console.error("Failed to delete task, restoring", err);
      // Restore the task on failure
      setProject((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          tasks: [...prev.tasks, taskToDelete],
        };
      });
    });
  };

  // Subtask actions
  const updateSubtaskStatus = async (taskId: string, subtaskId: string, status: TaskStatus) => {
    if (!project) return;
    await patchTask({ projectId: project.id, id: subtaskId, status });
    setProject((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === taskId
            ? { ...t, subtasks: t.subtasks.map((st) => (st.id === subtaskId ? { ...st, status } : st)) }
            : t
        ),
      };
    });
  };

  const updateSubtaskTitle = async (taskId: string, subtaskId: string, title: string) => {
    if (!project) return;
    await patchTask({ projectId: project.id, id: subtaskId, title });
    setProject((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === taskId
            ? { ...t, subtasks: t.subtasks.map((st) => (st.id === subtaskId ? { ...st, title } : st)) }
            : t
        ),
      };
    });
  };

  const removeSubtask = (taskId: string, subtaskId: string) => {
    if (!project) return;

    // Find the subtask to save for potential restoration
    const parentTask = project.tasks.find((t) => t.id === taskId);
    const subtaskToDelete = parentTask?.subtasks.find((st) => st.id === subtaskId);
    if (!subtaskToDelete) return;

    // Optimistic update - remove immediately
    setProject((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === taskId ? { ...t, subtasks: t.subtasks.filter((st) => st.id !== subtaskId) } : t
        ),
      };
    });

    // Call API in background
    deleteTask(project.id, subtaskId).catch((err) => {
      console.error("Failed to delete subtask, restoring", err);
      // Restore the subtask on failure
      setProject((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === taskId ? { ...t, subtasks: [...t.subtasks, subtaskToDelete] } : t
          ),
        };
      });
    });
  };

  const createSubtask = (taskId: string, title: string) => {
    if (!project) return;

    // Show skeleton immediately
    setPendingSubtaskCounts((prev) => {
      const next = new Map(prev);
      next.set(taskId, (next.get(taskId) ?? 0) + 1);
      return next;
    });

    // Fire API call in background
    postSubtask(project.id, taskId, title)
      .then((result) => {
        setProject((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            tasks: prev.tasks.map((t) =>
              t.id === taskId ? { ...t, subtasks: [...t.subtasks, result.task] } : t
            ),
          };
        });
      })
      .catch((err) => {
        console.error("Failed to create subtask", err);
      })
      .finally(() => {
        setPendingSubtaskCounts((prev) => {
          const next = new Map(prev);
          const current = next.get(taskId) ?? 0;
          if (current <= 1) {
            next.delete(taskId);
          } else {
            next.set(taskId, current - 1);
          }
          return next;
        });
      });
  };

  // Reorder task within its status group
  const reorderTask = async (taskId: string, afterId: string | null, beforeId: string | null) => {
    console.log("[reorderTask] Called with", { taskId, afterId, beforeId });

    if (!project) {
      console.log("[reorderTask] No project, returning");
      return;
    }

    const task = project.tasks.find((t) => t.id === taskId);
    if (!task) {
      console.log("[reorderTask] Task not found", { taskId });
      return;
    }

    console.log("[reorderTask] Task being dragged", {
      id: task.id,
      title: task.title,
      currentSortOrder: task.sortOrder,
    });

    // Get the sortOrders of the adjacent tasks
    const afterTask = afterId ? project.tasks.find((t) => t.id === afterId) : null;
    const beforeTask = beforeId ? project.tasks.find((t) => t.id === beforeId) : null;

    console.log("[reorderTask] Adjacent tasks", {
      afterTask: afterTask ? { id: afterTask.id, title: afterTask.title, sortOrder: afterTask.sortOrder } : null,
      beforeTask: beforeTask ? { id: beforeTask.id, title: beforeTask.title, sortOrder: beforeTask.sortOrder } : null,
    });

    const afterOrder = afterTask?.sortOrder ?? null;
    const beforeOrder = beforeTask?.sortOrder ?? null;

    console.log("[reorderTask] Sort order bounds", { afterOrder, beforeOrder });

    const newSortOrder = generateKeyBetween(afterOrder, beforeOrder);

    console.log("[reorderTask] Generated new sortOrder", { newSortOrder });

    // Optimistic update
    setProject((prev) => {
      if (!prev) return null;
      const updatedTasks = prev.tasks.map((t) => (t.id === taskId ? { ...t, sortOrder: newSortOrder } : t));

      // Log the updated tasks with their sortOrders
      console.log("[reorderTask] Tasks after optimistic update",
        updatedTasks.map((t) => ({ id: t.id, title: t.title, sortOrder: t.sortOrder, status: t.status }))
      );

      return {
        ...prev,
        tasks: updatedTasks,
      };
    });

    // Persist to server
    try {
      console.log("[reorderTask] Persisting to server", { projectId: project.id, taskId, sortOrder: newSortOrder });
      await patchTask({ projectId: project.id, id: taskId, sortOrder: newSortOrder });
      console.log("[reorderTask] Server persist successful");
    } catch (err) {
      console.error("[reorderTask] Server persist failed, reverting", err);
      // Revert on error
      load();
    }
  };

  // Reorder subtask within its parent
  const reorderSubtask = async (
    parentId: string,
    subtaskId: string,
    afterId: string | null,
    beforeId: string | null
  ) => {
    if (!project) return;

    const parentTask = project.tasks.find((t) => t.id === parentId);
    if (!parentTask) return;

    const subtask = parentTask.subtasks.find((st) => st.id === subtaskId);
    if (!subtask) return;

    // Get the sortOrders of the adjacent subtasks
    const afterSubtask = afterId ? parentTask.subtasks.find((st) => st.id === afterId) : null;
    const beforeSubtask = beforeId ? parentTask.subtasks.find((st) => st.id === beforeId) : null;

    const afterOrder = afterSubtask?.sortOrder ?? null;
    const beforeOrder = beforeSubtask?.sortOrder ?? null;

    const newSortOrder = generateKeyBetween(afterOrder, beforeOrder);

    // Optimistic update
    setProject((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === parentId
            ? {
                ...t,
                subtasks: t.subtasks.map((st) =>
                  st.id === subtaskId ? { ...st, sortOrder: newSortOrder } : st
                ),
              }
            : t
        ),
      };
    });

    // Persist to server
    try {
      await patchTask({ projectId: project.id, id: subtaskId, sortOrder: newSortOrder });
    } catch {
      // Revert on error
      load();
    }
  };

  // Sorted tasks (todo first, then done, then by sortOrder)
  // Note: Use standard string comparison (<, >) for sortOrder, not localeCompare,
  // because fractional-indexing generates keys designed for ASCII comparison
  const sortedTasks: TaskWithSubtasks[] = project
    ? [...project.tasks].sort((a, b) => {
        if (a.status !== b.status) {
          return a.status === "todo" ? -1 : 1;
        }
        const aOrder = a.sortOrder ?? "";
        const bOrder = b.sortOrder ?? "";
        return aOrder < bOrder ? -1 : aOrder > bOrder ? 1 : 0;
      })
    : [];

  return {
    project,
    tasks: sortedTasks,
    isLoading,
    error,
    pendingTaskCount,
    pendingSubtaskCounts,
    // Project actions
    updateName,
    remove,
    archive,
    unarchive,
    // Task actions
    createTask,
    updateTaskStatus,
    updateTaskTitle,
    updateTaskDescription,
    updateTaskDueDate,
    removeTask,
    reorderTask,
    // Subtask actions
    updateSubtaskStatus,
    updateSubtaskTitle,
    removeSubtask,
    createSubtask,
    reorderSubtask,
  };
};
