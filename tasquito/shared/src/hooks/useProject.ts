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
  tempId: string;
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

type TaskBatchDeleteQueueItem = {
  type: "batch-delete";
  projectId: string;
  taskIds: string[];
  tasksToRestore: TaskWithSubtasks[];
};

type TaskQueueItem = TaskCreateQueueItem | TaskStatusQueueItem | TaskDeleteQueueItem | TaskBatchDeleteQueueItem;

type SubtaskCreateQueueItem = {
  type: "create";
  projectId: string;
  taskId: string;
  title: string;
  tempId: string;
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

type SubtaskBatchDeleteQueueItem = {
  type: "batch-delete";
  projectId: string;
  taskId: string;
  subtaskIds: string[];
  subtasksToRestore: TaskDto[];
};

type SubtaskQueueItem = SubtaskCreateQueueItem | SubtaskStatusQueueItem | SubtaskDeleteQueueItem | SubtaskBatchDeleteQueueItem;

export const useProject = (id: string) => {
  const [project, setProject] = useState<ProjectWithTasksDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limitError, setLimitError] = useState<string | null>(null);
  const [pendingTaskIds, setPendingTaskIds] = useState<Set<string>>(new Set());
  const [pendingSubtaskIds, setPendingSubtaskIds] = useState<Set<string>>(new Set());

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
    const originalName = project.name;

    // Optimistic update
    setProject((prev) => (prev ? { ...prev, name } : null));

    try {
      await client.patchProject({ id: project.id, name });
    } catch (err) {
      console.error("Failed to update project name, reverting", err);
      setProject((prev) => (prev ? { ...prev, name: originalName } : null));
    }
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
          // Replace temp task with real one from server
          setProject((prev) => {
            if (!prev) {
              return null;
            }
            return {
              ...prev,
              tasks: prev.tasks.map((t) => (t.id === item.tempId ? { ...result.task, subtasks: result.subtasks ?? [] } : t)),
            };
          });
        })
        .catch((err) => {
          console.error("Failed to create task", err);
          // Remove temp task on error
          setProject((prev) => {
            if (!prev) {
              return null;
            }
            return {
              ...prev,
              tasks: prev.tasks.filter((t) => t.id !== item.tempId),
            };
          });
          if (err?.status === 403 && err?.message) {
            setLimitError(err.message);
          }
        })
        .finally(() => {
          setPendingTaskIds((prev) => {
            const next = new Set(prev);
            next.delete(item.tempId);
            return next;
          });
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
    } else if (item.type === "batch-delete") {
      client
        .batchDeleteTasks(item.projectId, item.taskIds)
        .catch((err) => {
          console.error("Failed to batch delete tasks, restoring", err);
          setProject((prev) => {
            if (!prev) {
              return null;
            }
            return {
              ...prev,
              tasks: [...prev.tasks, ...item.tasksToRestore],
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

    const tempId = `temp-${Date.now()}-${Math.random()}`;

    setPendingTaskIds((prev) => new Set(prev).add(tempId));

    // Optimistically add the task to the end of the todo list
    const todoTasks = project.tasks.filter((t) => t.status === "todo");
    const lastOrder = todoTasks.at(-1)?.sortOrder ?? null;
    const sortOrder = generateKeyBetween(lastOrder, null);

    setProject((prev) => {
      if (!prev) {
        return null;
      }
      return {
        ...prev,
        tasks: [
          ...prev.tasks,
          {
            id: tempId,
            projectId: project.id,
            title: data.title,
            status: "todo" as const,
            note: data.note,
            dueDate: data.dueDate,
            sortOrder,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            subtasks: [],
          },
        ],
      };
    });

    taskQueueRef.current.push({
      type: "create",
      projectId: project.id,
      title: data.title,
      note: data.note,
      dueDate: data.dueDate,
      subtasks: data.subtasks,
      tempId,
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
    const originalTitle = project.tasks.find((t) => t.id === taskId)?.title;

    // Optimistic update
    setProject((prev) => {
      if (!prev) {
        return null;
      }
      return {
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, title } : t)),
      };
    });

    try {
      await client.patchTask({ projectId: project.id, id: taskId, title });
    } catch (err) {
      console.error("Failed to update task title, reverting", err);
      setProject((prev) => {
        if (!prev) {
          return null;
        }
        return {
          ...prev,
          tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, title: originalTitle ?? t.title } : t)),
        };
      });
    }
  };

  const updateTaskNote = async (taskId: string, note: string) => {
    if (!project) {
      return;
    }
    const originalNote = project.tasks.find((t) => t.id === taskId)?.note;

    // Optimistic update
    setProject((prev) => {
      if (!prev) {
        return null;
      }
      return {
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, note } : t)),
      };
    });

    try {
      await client.patchTask({ projectId: project.id, id: taskId, note });
    } catch (err) {
      console.error("Failed to update task note, reverting", err);
      setProject((prev) => {
        if (!prev) {
          return null;
        }
        return {
          ...prev,
          tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, note: originalNote ?? t.note } : t)),
        };
      });
    }
  };

  const updateTaskDueDate = async (taskId: string, dueDate: string | undefined) => {
    if (!project) {
      return;
    }
    const originalDueDate = project.tasks.find((t) => t.id === taskId)?.dueDate;

    // Optimistic update
    setProject((prev) => {
      if (!prev) {
        return null;
      }
      return {
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, dueDate } : t)),
      };
    });

    try {
      await client.patchTask({ projectId: project.id, id: taskId, dueDate: dueDate ?? null });
    } catch (err) {
      console.error("Failed to update due date, reverting", err);
      setProject((prev) => {
        if (!prev) {
          return null;
        }
        return {
          ...prev,
          tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, dueDate: originalDueDate } : t)),
        };
      });
    }
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

  const batchRemoveTasks = (taskIds: string[]) => {
    if (!project || taskIds.length === 0) {
      return;
    }

    const idsToDelete = new Set(taskIds);
    const tasksToRestore = project.tasks.filter((t) => idsToDelete.has(t.id));

    // Optimistic update
    setProject((prev) => {
      if (!prev) {
        return null;
      }
      return {
        ...prev,
        tasks: prev.tasks.filter((t) => !idsToDelete.has(t.id)),
      };
    });

    taskQueueRef.current.push({
      type: "batch-delete",
      projectId: project.id,
      taskIds,
      tasksToRestore,
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
    const originalTitle = project.tasks.find((t) => t.id === taskId)?.subtasks.find((st) => st.id === subtaskId)?.title;

    // Optimistic update
    setProject((prev) => {
      if (!prev) {
        return null;
      }
      return {
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, subtasks: t.subtasks.map((st) => (st.id === subtaskId ? { ...st, title } : st)) } : t)),
      };
    });

    try {
      await client.patchTask({ projectId: project.id, id: subtaskId, title });
    } catch (err) {
      console.error("Failed to update subtask title, reverting", err);
      setProject((prev) => {
        if (!prev) {
          return null;
        }
        return {
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === taskId ? { ...t, subtasks: t.subtasks.map((st) => (st.id === subtaskId ? { ...st, title: originalTitle ?? st.title } : st)) } : t,
          ),
        };
      });
    }
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

  const batchRemoveSubtasks = (taskId: string, subtaskIds: string[]) => {
    if (!project || subtaskIds.length === 0) {
      return;
    }

    const parentTask = project.tasks.find((t) => t.id === taskId);
    const idsToDelete = new Set(subtaskIds);
    const subtasksToRestore = parentTask?.subtasks.filter((st) => idsToDelete.has(st.id)) ?? [];

    // Optimistic update
    setProject((prev) => {
      if (!prev) {
        return null;
      }
      return {
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, subtasks: t.subtasks.filter((st) => !idsToDelete.has(st.id)) } : t)),
      };
    });

    if (!subtaskQueuesRef.current.has(taskId)) {
      subtaskQueuesRef.current.set(taskId, []);
    }
    subtaskQueuesRef.current.get(taskId)!.push({
      type: "batch-delete",
      projectId: project.id,
      taskId,
      subtaskIds,
      subtasksToRestore,
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
          // Replace temp subtask with real one from server
          setProject((prev) => {
            if (!prev) {
              return null;
            }
            return {
              ...prev,
              tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, subtasks: t.subtasks.map((st) => (st.id === item.tempId ? result.task : st)) } : t)),
            };
          });
        })
        .catch((err) => {
          console.error("Failed to create subtask", err);
          // Remove temp subtask on error
          setProject((prev) => {
            if (!prev) {
              return null;
            }
            return {
              ...prev,
              tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, subtasks: t.subtasks.filter((st) => st.id !== item.tempId) } : t)),
            };
          });
          if (err?.status === 403 && err?.message) {
            setLimitError(err.message);
          }
        })
        .finally(() => {
          setPendingSubtaskIds((prev) => {
            const next = new Set(prev);
            next.delete(item.tempId);
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
    } else if (item.type === "batch-delete") {
      client
        .batchDeleteTasks(item.projectId, item.subtaskIds)
        .catch((err) => {
          console.error("Failed to batch delete subtasks, restoring", err);
          setProject((prev) => {
            if (!prev) {
              return null;
            }
            return {
              ...prev,
              tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, subtasks: [...t.subtasks, ...item.subtasksToRestore] } : t)),
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

    const tempId = `temp-${Date.now()}-${Math.random()}`;

    setPendingSubtaskIds((prev) => new Set(prev).add(tempId));

    // Optimistically add the subtask to the task's subtasks
    const parentTask = project.tasks.find((t) => t.id === taskId);
    const lastOrder = parentTask?.subtasks.at(-1)?.sortOrder ?? null;
    const sortOrder = generateKeyBetween(lastOrder, null);

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
                subtasks: [
                  ...t.subtasks,
                  {
                    id: tempId,
                    projectId: project.id,
                    parentId: taskId,
                    title,
                    status: "todo" as const,
                    sortOrder,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                  },
                ],
              }
            : t,
        ),
      };
    });

    if (!subtaskQueuesRef.current.has(taskId)) {
      subtaskQueuesRef.current.set(taskId, []);
    }
    subtaskQueuesRef.current.get(taskId)!.push({
      type: "create",
      projectId: project.id,
      taskId,
      title,
      tempId,
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
    pendingTaskIds,
    pendingSubtaskIds,
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
    batchRemoveTasks,
    reorderTask,
    // Subtask actions
    updateSubtaskStatus,
    updateSubtaskTitle,
    removeSubtask,
    batchRemoveSubtasks,
    createSubtask,
    reorderSubtask,
    // Refresh
    refresh: load,
  };
};
