import { generateKeyBetween } from "fractional-indexing";
import { useEffect, useRef, useState } from "react";
import type { ProjectWithTasksDto, TaskDto, TaskStatus } from "../api";
import * as client from "../client";

type TaskWithSubtasks = TaskDto & { subtasks: TaskDto[] };

type TaskCreateQueueItem = {
  type: "create";
  projectId: string;
  title: string;
  note?: string;
  dueDate?: string;
  subtasks?: string[];
};

type TaskStatusQueueItem = {
  type: "status";
  projectId: string;
  taskId: string;
  status: TaskStatus;
  originalStatus: TaskStatus;
};

type TaskDeleteQueueItem = {
  type: "delete";
  projectId: string;
  taskId: string;
  taskToRestore: TaskWithSubtasks;
};

type TaskQueueItem = TaskCreateQueueItem | TaskStatusQueueItem | TaskDeleteQueueItem;

type SubtaskCreateQueueItem = {
  type: "create";
  projectId: string;
  taskId: string;
  title: string;
};

type SubtaskStatusQueueItem = {
  type: "status";
  projectId: string;
  taskId: string;
  subtaskId: string;
  status: TaskStatus;
  originalStatus: TaskStatus;
};

type SubtaskDeleteQueueItem = {
  type: "delete";
  projectId: string;
  taskId: string;
  subtaskId: string;
  subtaskToRestore: TaskDto;
};

type SubtaskQueueItem = SubtaskCreateQueueItem | SubtaskStatusQueueItem | SubtaskDeleteQueueItem;

export const useProject = (id: string) => {
  const [project, setProject] = useState<ProjectWithTasksDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limitError, setLimitError] = useState<string | null>(null);
  const [pendingTaskCount, setPendingTaskCount] = useState(0);
  const [pendingSubtaskCounts, setPendingSubtaskCounts] = useState<Map<string, number>>(new Map());

  // Queue refs for sequential API calls
  const taskQueueRef = useRef<TaskQueueItem[]>([]);
  const isProcessingTaskRef = useRef(false);
  const subtaskQueuesRef = useRef<Map<string, SubtaskQueueItem[]>>(new Map());
  const processingSubtasksRef = useRef<Set<string>>(new Set());

  const clearLimitError = () => setLimitError(null);

  const load = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await client.getProject(id);
      setProject(data.project);
    } catch (err) {
      console.error(err);
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
    if (!project) {
      return;
    }
    await client.patchProject({ id: project.id, name });
    setProject((prev) => (prev ? { ...prev, name } : null));
  };

  const remove = async () => {
    if (!project) {
      return;
    }
    await client.deleteProject(project.id);
  };

  const archive = async () => {
    if (!project) {
      return;
    }
    await client.archiveProject(project.id);
  };

  const unarchive = async () => {
    if (!project) {
      return;
    }
    try {
      await client.unarchiveProject(project.id);
      await load();
    } catch (err: unknown) {
      const error = err as { status?: number; message?: string };
      if (error?.status === 403 && error?.message) {
        setLimitError(error.message);
      }
      throw err;
    }
  };

  // Process task queue sequentially
  const processTaskQueue = () => {
    if (isProcessingTaskRef.current || taskQueueRef.current.length === 0) {
      return;
    }

    isProcessingTaskRef.current = true;
    const item = taskQueueRef.current.shift()!;

    if (item.type === "create") {
      client
        .postTask({
          projectId: item.projectId,
          title: item.title,
          note: item.note,
          dueDate: item.dueDate,
          subtasks: item.subtasks,
        })
        .then((result) => {
          setProject((prev) => {
            if (!prev) {
              return null;
            }
            return {
              ...prev,
              tasks: [{ ...result.task, subtasks: result.subtasks ?? [] }, ...prev.tasks],
            };
          });
        })
        .catch((err) => {
          console.error("Failed to create task", err);
          if (err?.status === 403 && err?.message) {
            setLimitError(err.message);
          }
        })
        .finally(() => {
          setPendingTaskCount((c) => c - 1);
          isProcessingTaskRef.current = false;
          processTaskQueue();
        });
    } else if (item.type === "status") {
      client
        .patchTask({ projectId: item.projectId, id: item.taskId, status: item.status })
        .catch((err) => {
          console.error("Failed to update task status, reverting", err);
          setProject((prev) => {
            if (!prev) {
              return null;
            }
            return {
              ...prev,
              tasks: prev.tasks.map((t) => (t.id === item.taskId ? { ...t, status: item.originalStatus } : t)),
            };
          });
        })
        .finally(() => {
          isProcessingTaskRef.current = false;
          processTaskQueue();
        });
    } else if (item.type === "delete") {
      client
        .deleteTask(item.projectId, item.taskId)
        .catch((err) => {
          console.error("Failed to delete task, restoring", err);
          setProject((prev) => {
            if (!prev) {
              return null;
            }
            return {
              ...prev,
              tasks: [...prev.tasks, item.taskToRestore],
            };
          });
        })
        .finally(() => {
          isProcessingTaskRef.current = false;
          processTaskQueue();
        });
    }
  };

  // Task actions
  const createTask = (data: { title: string; note?: string; dueDate?: string; subtasks?: string[] }) => {
    if (!project) {
      return;
    }

    setPendingTaskCount((c) => c + 1);

    taskQueueRef.current.push({
      type: "create",
      projectId: project.id,
      title: data.title,
      note: data.note,
      dueDate: data.dueDate,
      subtasks: data.subtasks,
    });

    processTaskQueue();
  };

  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    if (!project) {
      return;
    }

    const originalTask = project.tasks.find((t) => t.id === taskId);
    if (!originalTask) {
      return;
    }
    const originalStatus = originalTask.status;

    // Optimistic update
    setProject((prev) => {
      if (!prev) {
        return null;
      }
      return {
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, status } : t)),
      };
    });

    taskQueueRef.current.push({
      type: "status",
      projectId: project.id,
      taskId,
      status,
      originalStatus,
    });

    processTaskQueue();
  };

  const updateTaskTitle = async (taskId: string, title: string) => {
    if (!project) {
      return;
    }
    await client.patchTask({ projectId: project.id, id: taskId, title });
    setProject((prev) => {
      if (!prev) {
        return null;
      }
      return {
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, title } : t)),
      };
    });
  };

  const updateTaskNote = async (taskId: string, note: string) => {
    if (!project) {
      return;
    }
    await client.patchTask({ projectId: project.id, id: taskId, note });
    setProject((prev) => {
      if (!prev) {
        return null;
      }
      return {
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, note } : t)),
      };
    });
  };

  const updateTaskDueDate = async (taskId: string, dueDate: string | undefined) => {
    if (!project) {
      return;
    }
    await client.patchTask({ projectId: project.id, id: taskId, dueDate: dueDate ?? null });
    setProject((prev) => {
      if (!prev) {
        return null;
      }
      return {
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, dueDate } : t)),
      };
    });
  };

  const removeTask = (taskId: string) => {
    if (!project) {
      return;
    }

    const taskToDelete = project.tasks.find((t) => t.id === taskId);
    if (!taskToDelete) {
      return;
    }

    // Optimistic update
    setProject((prev) => {
      if (!prev) {
        return null;
      }
      return {
        ...prev,
        tasks: prev.tasks.filter((t) => t.id !== taskId),
      };
    });

    taskQueueRef.current.push({
      type: "delete",
      projectId: project.id,
      taskId,
      taskToRestore: taskToDelete,
    });

    processTaskQueue();
  };

  // Subtask actions
  const updateSubtaskStatus = (taskId: string, subtaskId: string, status: TaskStatus) => {
    if (!project) {
      return;
    }

    const parentTask = project.tasks.find((t) => t.id === taskId);
    const originalSubtask = parentTask?.subtasks.find((st) => st.id === subtaskId);
    if (!originalSubtask) {
      return;
    }
    const originalStatus = originalSubtask.status;

    // Optimistic update
    setProject((prev) => {
      if (!prev) {
        return null;
      }
      return {
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, subtasks: t.subtasks.map((st) => (st.id === subtaskId ? { ...st, status } : st)) } : t)),
      };
    });

    if (!subtaskQueuesRef.current.has(taskId)) {
      subtaskQueuesRef.current.set(taskId, []);
    }
    subtaskQueuesRef.current.get(taskId)!.push({
      type: "status",
      projectId: project.id,
      taskId,
      subtaskId,
      status,
      originalStatus,
    });

    processSubtaskQueue(taskId);
  };

  const updateSubtaskTitle = async (taskId: string, subtaskId: string, title: string) => {
    if (!project) {
      return;
    }
    await client.patchTask({ projectId: project.id, id: subtaskId, title });
    setProject((prev) => {
      if (!prev) {
        return null;
      }
      return {
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, subtasks: t.subtasks.map((st) => (st.id === subtaskId ? { ...st, title } : st)) } : t)),
      };
    });
  };

  const removeSubtask = (taskId: string, subtaskId: string) => {
    if (!project) {
      return;
    }

    const parentTask = project.tasks.find((t) => t.id === taskId);
    const subtaskToDelete = parentTask?.subtasks.find((st) => st.id === subtaskId);
    if (!subtaskToDelete) {
      return;
    }

    // Optimistic update
    setProject((prev) => {
      if (!prev) {
        return null;
      }
      return {
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, subtasks: t.subtasks.filter((st) => st.id !== subtaskId) } : t)),
      };
    });

    if (!subtaskQueuesRef.current.has(taskId)) {
      subtaskQueuesRef.current.set(taskId, []);
    }
    subtaskQueuesRef.current.get(taskId)!.push({
      type: "delete",
      projectId: project.id,
      taskId,
      subtaskId,
      subtaskToRestore: subtaskToDelete,
    });

    processSubtaskQueue(taskId);
  };

  // Process subtask queue for a specific task sequentially
  const processSubtaskQueue = (taskId: string) => {
    if (processingSubtasksRef.current.has(taskId)) {
      return;
    }

    const queue = subtaskQueuesRef.current.get(taskId);
    if (!queue || queue.length === 0) {
      return;
    }

    processingSubtasksRef.current.add(taskId);
    const item = queue.shift()!;

    if (item.type === "create") {
      client
        .postSubtask(item.projectId, item.taskId, item.title)
        .then((result) => {
          setProject((prev) => {
            if (!prev) {
              return null;
            }
            return {
              ...prev,
              tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, subtasks: [...t.subtasks, result.task] } : t)),
            };
          });
        })
        .catch((err) => {
          console.error("Failed to create subtask", err);
          if (err?.status === 403 && err?.message) {
            setLimitError(err.message);
          }
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
          processingSubtasksRef.current.delete(taskId);
          processSubtaskQueue(taskId);
        });
    } else if (item.type === "status") {
      client
        .patchTask({ projectId: item.projectId, id: item.subtaskId, status: item.status })
        .catch((err) => {
          console.error("Failed to update subtask status, reverting", err);
          setProject((prev) => {
            if (!prev) {
              return null;
            }
            return {
              ...prev,
              tasks: prev.tasks.map((t) =>
                t.id === taskId
                  ? {
                      ...t,
                      subtasks: t.subtasks.map((st) => (st.id === item.subtaskId ? { ...st, status: item.originalStatus } : st)),
                    }
                  : t,
              ),
            };
          });
        })
        .finally(() => {
          processingSubtasksRef.current.delete(taskId);
          processSubtaskQueue(taskId);
        });
    } else if (item.type === "delete") {
      client
        .deleteTask(item.projectId, item.subtaskId)
        .catch((err) => {
          console.error("Failed to delete subtask, restoring", err);
          setProject((prev) => {
            if (!prev) {
              return null;
            }
            return {
              ...prev,
              tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, subtasks: [...t.subtasks, item.subtaskToRestore] } : t)),
            };
          });
        })
        .finally(() => {
          processingSubtasksRef.current.delete(taskId);
          processSubtaskQueue(taskId);
        });
    }
  };

  const createSubtask = (taskId: string, title: string) => {
    if (!project) {
      return;
    }

    setPendingSubtaskCounts((prev) => {
      const next = new Map(prev);
      next.set(taskId, (next.get(taskId) ?? 0) + 1);
      return next;
    });

    if (!subtaskQueuesRef.current.has(taskId)) {
      subtaskQueuesRef.current.set(taskId, []);
    }
    subtaskQueuesRef.current.get(taskId)!.push({
      type: "create",
      projectId: project.id,
      taskId,
      title,
    });

    processSubtaskQueue(taskId);
  };

  // Reorder task within its status group
  const reorderTask = async (taskId: string, afterId: string | null, beforeId: string | null) => {
    if (!project) {
      return;
    }

    const task = project.tasks.find((t) => t.id === taskId);
    if (!task) {
      return;
    }

    const afterTask = afterId ? project.tasks.find((t) => t.id === afterId) : null;
    const beforeTask = beforeId ? project.tasks.find((t) => t.id === beforeId) : null;

    const afterOrder = afterTask?.sortOrder ?? null;
    const beforeOrder = beforeTask?.sortOrder ?? null;

    const newSortOrder = generateKeyBetween(afterOrder, beforeOrder);

    // Optimistic update
    setProject((prev) => {
      if (!prev) {
        return null;
      }
      return {
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, sortOrder: newSortOrder } : t)),
      };
    });

    try {
      await client.patchTask({ projectId: project.id, id: taskId, sortOrder: newSortOrder });
    } catch (err) {
      console.error(err);
      load();
    }
  };

  // Reorder subtask within its parent
  const reorderSubtask = async (parentId: string, subtaskId: string, afterId: string | null, beforeId: string | null) => {
    if (!project) {
      return;
    }

    const parentTask = project.tasks.find((t) => t.id === parentId);
    if (!parentTask) {
      return;
    }

    const subtask = parentTask.subtasks.find((st) => st.id === subtaskId);
    if (!subtask) {
      return;
    }

    const afterSubtask = afterId ? parentTask.subtasks.find((st) => st.id === afterId) : null;
    const beforeSubtask = beforeId ? parentTask.subtasks.find((st) => st.id === beforeId) : null;

    const afterOrder = afterSubtask?.sortOrder ?? null;
    const beforeOrder = beforeSubtask?.sortOrder ?? null;

    const newSortOrder = generateKeyBetween(afterOrder, beforeOrder);

    // Optimistic update
    setProject((prev) => {
      if (!prev) {
        return null;
      }
      return {
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === parentId
            ? {
                ...t,
                subtasks: t.subtasks.map((st) => (st.id === subtaskId ? { ...st, sortOrder: newSortOrder } : st)),
              }
            : t,
        ),
      };
    });

    try {
      await client.patchTask({ projectId: project.id, id: subtaskId, sortOrder: newSortOrder });
    } catch {
      load();
    }
  };

  // Sorted tasks: todo first, then done, each sorted by sortOrder (ASCII comparison)
  // Also sort subtasks within each task by sortOrder
  const sortedTasks: TaskWithSubtasks[] = project
    ? [...project.tasks]
        .sort((a, b) => {
          if (a.status !== b.status) {
            return a.status === "todo" ? -1 : 1;
          }
          const aOrder = a.sortOrder ?? "";
          const bOrder = b.sortOrder ?? "";
          return aOrder < bOrder ? -1 : aOrder > bOrder ? 1 : 0;
        })
        .map((task) => ({
          ...task,
          subtasks: [...task.subtasks].sort((a, b) => {
            const aOrder = a.sortOrder ?? "";
            const bOrder = b.sortOrder ?? "";
            return aOrder < bOrder ? -1 : aOrder > bOrder ? 1 : 0;
          }),
        }))
    : [];

  return {
    project,
    tasks: sortedTasks,
    isLoading,
    error,
    limitError,
    clearLimitError,
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
    updateTaskNote,
    updateTaskDueDate,
    removeTask,
    reorderTask,
    // Subtask actions
    updateSubtaskStatus,
    updateSubtaskTitle,
    removeSubtask,
    createSubtask,
    reorderSubtask,
    // Refresh
    refresh: load,
  };
};
