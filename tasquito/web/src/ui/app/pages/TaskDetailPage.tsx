import { ArrowLeft } from "lucide-preact";
import { useEffect, useState } from "preact/hooks";
import type { TaskDto, TaskStatus } from "@broccoliapps/tasquito-shared";
import { deleteTask, getTask, patchTask } from "../api";
import { Button, Input, Modal, TaskStatusBadge } from "../components";

type TaskDetailPageProps = {
  id: string;
};

export const TaskDetailPage = ({ id }: TaskDetailPageProps) => {
  const [task, setTask] = useState<TaskDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit state
  const [editedTitle, setEditedTitle] = useState("");
  const [editedStatus, setEditedStatus] = useState<TaskStatus>("todo");
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Delete state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const loadTask = async () => {
      try {
        setIsLoading(true);
        const data = await getTask(id);
        setTask(data.task);
        setEditedTitle(data.task.title);
        setEditedStatus(data.task.status);
        setError(null);
      } catch (err) {
        setError("Failed to load task");
      } finally {
        setIsLoading(false);
      }
    };

    loadTask();
  }, [id]);

  useEffect(() => {
    if (task) {
      const titleChanged = editedTitle !== task.title;
      const statusChanged = editedStatus !== task.status;
      setHasChanges(titleChanged || statusChanged);
    }
  }, [editedTitle, editedStatus, task]);

  const handleSave = async () => {
    if (!task || !hasChanges) return;

    setIsSaving(true);
    try {
      const result = await patchTask({
        id: task.id,
        ...(editedTitle !== task.title && { title: editedTitle }),
        ...(editedStatus !== task.status && { status: editedStatus }),
      });
      setTask(result.task);
      setHasChanges(false);
    } catch (err) {
      setError("Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (task) {
      setEditedTitle(task.title);
      setEditedStatus(task.status);
      setHasChanges(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;

    setIsDeleting(true);
    try {
      await deleteTask(task.id);
      window.location.href = "/app";
    } catch (err) {
      setError("Failed to delete task");
      setIsDeleting(false);
    }
  };

  const goBack = () => {
    window.location.href = "/app";
  };

  if (isLoading) {
    return (
      <div class="flex items-center justify-center py-12">
        <p class="text-neutral-500">Loading task...</p>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div class="text-center py-12">
        <p class="text-red-600 mb-4">{error ?? "Task not found"}</p>
        <button onClick={goBack} class="text-emerald-600 hover:text-emerald-700 font-medium">
          Go back
        </button>
      </div>
    );
  }

  return (
    <div class="space-y-6">
      {/* Header */}
      <div class="flex items-center gap-4">
        <button
          onClick={goBack}
          class="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 class="text-2xl font-bold text-neutral-900">Task Details</h1>
      </div>

      {/* Task Form */}
      <div class="bg-white rounded-lg border border-neutral-200 p-6 space-y-6">
        {/* Title */}
        <div>
          <Input
            label="Title"
            type="text"
            value={editedTitle}
            onInput={(e) => setEditedTitle((e.target as HTMLInputElement).value)}
            placeholder="Enter task title"
          />
        </div>

        {/* Status */}
        <div>
          <label class="block text-sm font-medium text-neutral-700 mb-1">Status</label>
          <div class="flex items-center gap-4">
            <select
              value={editedStatus}
              onChange={(e) => setEditedStatus((e.target as HTMLSelectElement).value as TaskStatus)}
              class="px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
            <TaskStatusBadge status={editedStatus} />
          </div>
        </div>

        {/* Timestamps */}
        <div class="grid grid-cols-2 gap-4 text-sm text-neutral-500">
          <div>
            <span class="font-medium">Created:</span>{" "}
            {new Date(task.createdAt).toLocaleString()}
          </div>
          <div>
            <span class="font-medium">Updated:</span>{" "}
            {new Date(task.updatedAt).toLocaleString()}
          </div>
        </div>

        {/* Actions */}
        <div class="flex items-center justify-between pt-4 border-t border-neutral-200">
          <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
            Delete Task
          </Button>

          <div class="flex items-center gap-3">
            {hasChanges && (
              <Button variant="secondary" onClick={handleCancel} disabled={isSaving}>
                Cancel
              </Button>
            )}
            <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Task"
        confirmText="Delete"
        confirmVariant="danger"
        onConfirm={handleDelete}
        isLoading={isDeleting}
      >
        <p class="text-neutral-600">
          Are you sure you want to delete "{task.title}"? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};
