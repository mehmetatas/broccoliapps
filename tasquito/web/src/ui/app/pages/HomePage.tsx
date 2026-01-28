import { useEffect, useState } from "preact/hooks";
import type { TaskDto, TaskStatus } from "@broccoliapps/tasquito-shared";
import { deleteTask, getTasks, invalidateTasksCache, postTask } from "../api";
import { Modal, TaskForm, TaskTable } from "../components";

type StatusFilter = "all" | TaskStatus;

export const HomePage = () => {
  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [taskToDelete, setTaskToDelete] = useState<TaskDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      const data = await getTasks();
      setTasks(data.tasks);
      setError(null);
    } catch (err) {
      setError("Failed to load tasks");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleCreateTask = async (title: string) => {
    const result = await postTask({ title });
    setTasks((prev) => [result.task, ...prev]);
  };

  const handleRowClick = (task: TaskDto) => {
    window.location.href = `/app/tasks/${task.id}`;
  };

  const handleEdit = (task: TaskDto) => {
    window.location.href = `/app/tasks/${task.id}`;
  };

  const handleDeleteClick = (task: TaskDto) => {
    setTaskToDelete(task);
  };

  const handleDeleteConfirm = async () => {
    if (!taskToDelete) return;

    setIsDeleting(true);
    try {
      await deleteTask(taskToDelete.id);
      setTasks((prev) => prev.filter((t) => t.id !== taskToDelete.id));
      setTaskToDelete(null);
    } catch (err) {
      // Error handling - keep modal open
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRefresh = () => {
    invalidateTasksCache();
    loadTasks();
  };

  const filteredTasks = tasks.filter((task) => {
    if (statusFilter === "all") return true;
    return task.status === statusFilter;
  });

  // Sort tasks: todo first, then in_progress, then done
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const order: Record<TaskStatus, number> = { todo: 0, in_progress: 1, done: 2 };
    return order[a.status] - order[b.status];
  });

  if (isLoading) {
    return (
      <div class="flex items-center justify-center py-12">
        <p class="text-neutral-500">Loading tasks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div class="text-center py-12">
        <p class="text-red-600 mb-4">{error}</p>
        <button
          onClick={handleRefresh}
          class="text-emerald-600 hover:text-emerald-700 font-medium"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-neutral-900">Tasks</h1>
        <button
          onClick={handleRefresh}
          class="text-sm text-neutral-500 hover:text-neutral-700"
        >
          Refresh
        </button>
      </div>

      {/* Create Task Form */}
      <div class="bg-white rounded-lg border border-neutral-200 p-4">
        <TaskForm onSubmit={handleCreateTask} />
      </div>

      {/* Filter */}
      <div class="flex items-center gap-2">
        <span class="text-sm text-neutral-600">Filter:</span>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter((e.target as HTMLSelectElement).value as StatusFilter)}
          class="px-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="all">All</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>
        <span class="text-sm text-neutral-500">
          ({sortedTasks.length} task{sortedTasks.length !== 1 ? "s" : ""})
        </span>
      </div>

      {/* Task Table */}
      <TaskTable
        tasks={sortedTasks}
        onRowClick={handleRowClick}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={taskToDelete !== null}
        onClose={() => setTaskToDelete(null)}
        title="Delete Task"
        confirmText="Delete"
        confirmVariant="danger"
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
      >
        <p class="text-neutral-600">
          Are you sure you want to delete "{taskToDelete?.title}"? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};
