import type { ProjectWithTasksDto, TaskDto, TaskStatus } from "@broccoliapps/tasquito-shared";
import { generateKeyBetween } from "fractional-indexing";
import { useEffect, useRef, useState } from "preact/hooks";
import { archiveProject, deleteProject, deleteTask, getProject, patchProject, patchTask, postSubtask, postTask, unarchiveProject } from "../api";

type TaskWithSubtasks = TaskDto & { subtasks: TaskDto[] };

type TaskCreateQueueItem = {
  type: "create";
  projectId: string;
  title: string;
  description?: string;
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
    if (!project) {
      return;
    }
    await patchProject({ id: project.id, name });
    setProject((prev) => (prev ? { ...prev, name } : null));
  };

  const remove = async () => {
    if (!project) {
      return;
    }
    await deleteProject(project.id);
  };

  const archive = async () => {
    if (!project) {
      return;
    }
    await archiveProject(project.id);
  };

  const unarchive = async () => {
    if (!project) {
      return;
    }
    try {
      await unarchiveProject(project.id);
      await load();
    } catch (err: unknown) {
      // Check for limit error (403)
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
      postTask({
        projectId: item.projectId,
        title: item.title,
        description: item.description,
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
      patchTask({ projectId: item.projectId, id: item.taskId, status: item.status })
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
      deleteTask(item.projectId, item.taskId)
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
  const createTask = (data: { title: string; description?: string; dueDate?: string; subtasks?: string[] }) => {
    if (!project) {
      return;
    }

    // Show skeleton immediately
    setPendingTaskCount((c) => c + 1);

    // Add to queue
    taskQueueRef.current.push({
      type: "create",
      projectId: project.id,
      title: data.title,
      description: data.description,
      dueDate: data.dueDate,
      subtasks: data.subtasks,
    });

    // Start processing if not already
    processTaskQueue();
  };

  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    if (!project) {
      return;
    }

    // Save original status for potential rollback
    const originalTask = project.tasks.find((t) => t.id === taskId);
    if (!originalTask) {
      return;
    }
    const originalStatus = originalTask.status;

    // Optimistic update - move immediately
    setProject((prev) => {
      if (!prev) {
        return null;
      }
      return {
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, status } : t)),
      };
    });

    // Add to queue
    taskQueueRef.current.push({
      type: "status",
      projectId: project.id,
      taskId,
      status,
      originalStatus,
    });

    // Start processing if not already
    processTaskQueue();
  };

  const updateTaskTitle = async (taskId: string, title: string) => {
    if (!project) {
      return;
    }
    await patchTask({ projectId: project.id, id: taskId, title });
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

  const updateTaskDescription = async (taskId: string, description: string) => {
    if (!project) {
      return;
    }
    await patchTask({ projectId: project.id, id: taskId, description });
    setProject((prev) => {
      if (!prev) {
        return null;
      }
      return {
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, description } : t)),
      };
    });
  };

  const updateTaskDueDate = async (taskId: string, dueDate: string | undefined) => {
    if (!project) {
      return;
    }
    await patchTask({ projectId: project.id, id: taskId, dueDate: dueDate ?? null });
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

    // Find the task to save for potential restoration
    const taskToDelete = project.tasks.find((t) => t.id === taskId);
    if (!taskToDelete) {
      return;
    }

    // Optimistic update - remove immediately
    setProject((prev) => {
      if (!prev) {
        return null;
      }
      return {
        ...prev,
        tasks: prev.tasks.filter((t) => t.id !== taskId),
      };
    });

    // Add to queue
    taskQueueRef.current.push({
      type: "delete",
      projectId: project.id,
      taskId,
      taskToRestore: taskToDelete,
    });

    // Start processing if not already
    processTaskQueue();
  };

  // Subtask actions
  const updateSubtaskStatus = (taskId: string, subtaskId: string, status: TaskStatus) => {
    if (!project) {
      return;
    }

    // Save original status for potential rollback
    const parentTask = project.tasks.find((t) => t.id === taskId);
    const originalSubtask = parentTask?.subtasks.find((st) => st.id === subtaskId);
    if (!originalSubtask) {
      return;
    }
    const originalStatus = originalSubtask.status;

    // Optimistic update - move immediately
    setProject((prev) => {
      if (!prev) {
        return null;
      }
      return {
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === taskId
            ? { ...t, subtasks: t.subtasks.map((st) => (st.id === subtaskId ? { ...st, status } : st)) }
            : t
        ),
      };
    });

    // Add to queue for this task
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

    // Start processing if not already
    processSubtaskQueue(taskId);
  };

  const updateSubtaskTitle = async (taskId: string, subtaskId: string, title: string) => {
    if (!project) {
      return;
    }
    await patchTask({ projectId: project.id, id: subtaskId, title });
    setProject((prev) => {
      if (!prev) {
        return null;
      }
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
    if (!project) {
      return;
    }

    // Find the subtask to save for potential restoration
    const parentTask = project.tasks.find((t) => t.id === taskId);
    const subtaskToDelete = parentTask?.subtasks.find((st) => st.id === subtaskId);
    if (!subtaskToDelete) {
      return;
    }

    // Optimistic update - remove immediately
    setProject((prev) => {
      if (!prev) {
        return null;
      }
      return {
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === taskId ? { ...t, subtasks: t.subtasks.filter((st) => st.id !== subtaskId) } : t
        ),
      };
    });

    // Add to queue for this task
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

    // Start processing if not already
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
      postSubtask(item.projectId, item.taskId, item.title)
        .then((result) => {
          setProject((prev) => {
            if (!prev) {
              return null;
            }
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
      patchTask({ projectId: item.projectId, id: item.subtaskId, status: item.status })
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
                  ? { ...t, subtasks: t.subtasks.map((st) => (st.id === item.subtaskId ? { ...st, status: item.originalStatus } : st)) }
                  : t
              ),
            };
          });
        })
        .finally(() => {
          processingSubtasksRef.current.delete(taskId);
          processSubtaskQueue(taskId);
        });
    } else if (item.type === "delete") {
      deleteTask(item.projectId, item.subtaskId)
        .catch((err) => {
          console.error("Failed to delete subtask, restoring", err);
          setProject((prev) => {
            if (!prev) {
              return null;
            }
            return {
              ...prev,
              tasks: prev.tasks.map((t) =>
                t.id === taskId ? { ...t, subtasks: [...t.subtasks, item.subtaskToRestore] } : t
              ),
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

    // Show skeleton immediately
    setPendingSubtaskCounts((prev) => {
      const next = new Map(prev);
      next.set(taskId, (next.get(taskId) ?? 0) + 1);
      return next;
    });

    // Add to queue for this task
    if (!subtaskQueuesRef.current.has(taskId)) {
      subtaskQueuesRef.current.set(taskId, []);
    }
    subtaskQueuesRef.current.get(taskId)!.push({
      type: "create",
      projectId: project.id,
      taskId,
      title,
    });

    // Start processing if not already
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

    // Get the sortOrders of the adjacent tasks
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
      const updatedTasks = prev.tasks.map((t) => (t.id === taskId ? { ...t, sortOrder: newSortOrder } : t));

      return {
        ...prev,
        tasks: updatedTasks,
      };
    });

    // Persist to server
    try {
      await patchTask({ projectId: project.id, id: taskId, sortOrder: newSortOrder });
    } catch (err) {
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

    // Get the sortOrders of the adjacent subtasks
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
