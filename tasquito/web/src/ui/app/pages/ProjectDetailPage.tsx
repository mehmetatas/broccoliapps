import type { TaskDto } from "@broccoliapps/tasquito-shared";
import { Archive, ArchiveRestore, ArrowLeft, CheckSquare, ChevronDown, ChevronRight, Trash2 } from "lucide-preact";
import { useMemo, useState } from "preact/hooks";
import { ArchiveConfirmModal, DeleteConfirmModal, EditableText, EmptyState, IconButton, ProjectDetailSkeleton, TaskCard, TaskCardSkeleton, TaskForm } from "../components";
import { useDragAndDrop, useProject } from "../hooks";
import { AppLink } from "../SpaApp";

type ProjectDetailPageProps = {
  id: string;
};

type TaskWithSubtasks = TaskDto & { subtasks: TaskDto[] };

export const ProjectDetailPage = ({ id }: ProjectDetailPageProps) => {
  const {
    project,
    tasks,
    isLoading,
    error,
    pendingTaskCount,
    pendingSubtaskCounts,
    updateName,
    remove,
    archive,
    unarchive,
    createTask,
    updateTaskStatus,
    updateTaskTitle,
    updateTaskDescription,
    updateTaskDueDate,
    removeTask,
    reorderTask,
    updateSubtaskStatus,
    updateSubtaskTitle,
    removeSubtask,
    createSubtask,
    reorderSubtask,
  } = useProject(id);

  const isArchived = project?.isArchived ?? false;

  // Split tasks by status
  const { todoTasks, doneTasks } = useMemo(() => {
    const todo: TaskWithSubtasks[] = [];
    const done: TaskWithSubtasks[] = [];
    for (const task of tasks) {
      if (task.status === "done") {
        done.push(task);
      } else {
        todo.push(task);
      }
    }
    return { todoTasks: todo, doneTasks: done };
  }, [tasks]);

  // Drag and drop for todo tasks
  const { containerRef: todoContainerRef } = useDragAndDrop({
    items: todoTasks,
    onReorder: reorderTask,
    disabled: isArchived,
  });

  // Drag and drop for done tasks - disabled since done tasks shouldn't be reordered
  const { containerRef: doneContainerRef } = useDragAndDrop({
    items: doneTasks,
    onReorder: reorderTask,
    disabled: true,
  });

  const [showArchiveProjectModal, setShowArchiveProjectModal] = useState(false);
  const [isArchivingProject, setIsArchivingProject] = useState(false);
  const [showUnarchiveProjectModal, setShowUnarchiveProjectModal] = useState(false);
  const [isUnarchivingProject, setIsUnarchivingProject] = useState(false);
  const [showDeleteProjectModal, setShowDeleteProjectModal] = useState(false);
  const [isDeletingProject, setIsDeletingProject] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<TaskWithSubtasks | null>(null);
  const [isDeletingTask, setIsDeletingTask] = useState(false);
  const [showDoneTasks, setShowDoneTasks] = useState(false);

  const handleArchiveProject = async () => {
    setIsArchivingProject(true);
    try {
      await archive();
      window.location.href = "/app";
    } catch {
      setIsArchivingProject(false);
    }
  };

  const handleUnarchiveProject = async () => {
    setIsUnarchivingProject(true);
    try {
      await unarchive();
      setShowUnarchiveProjectModal(false);
    } catch {
      // Keep modal open on error
    } finally {
      setIsUnarchivingProject(false);
    }
  };

  const handleDeleteProject = async () => {
    setIsDeletingProject(true);
    try {
      await remove();
      window.location.href = "/app";
    } catch {
      setIsDeletingProject(false);
    }
  };

  // Calculate days until deletion for archived projects
  const getDaysUntilDeletion = () => {
    if (!project?.archivedAt) return null;
    const twoWeeksMs = 14 * 24 * 60 * 60 * 1000;
    const deletionTime = project.archivedAt + twoWeeksMs;
    const now = Date.now();
    const daysRemaining = Math.ceil((deletionTime - now) / (24 * 60 * 60 * 1000));
    return Math.max(0, daysRemaining);
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    setIsDeletingTask(true);
    try {
      await removeTask(taskToDelete.id);
      setTaskToDelete(null);
    } catch {
      // Keep modal open on error
    } finally {
      setIsDeletingTask(false);
    }
  };

  const handleTaskDelete = (task: TaskWithSubtasks) => {
    if (task.status === "done") {
      // Delete done tasks immediately without confirmation
      removeTask(task.id);
    } else {
      // Show confirmation modal for non-done tasks
      setTaskToDelete(task);
    }
  };

  const renderTaskCard = (task: TaskWithSubtasks) => (
    <TaskCard
      key={task.id}
      task={task}
      disabled={isArchived}
      pendingSubtaskCount={pendingSubtaskCounts.get(task.id) ?? 0}
      onToggleStatus={(status) => updateTaskStatus(task.id, status)}
      onUpdateTitle={(title) => updateTaskTitle(task.id, title)}
      onUpdateDescription={(desc) => updateTaskDescription(task.id, desc)}
      onUpdateDueDate={(date) => updateTaskDueDate(task.id, date)}
      onDelete={() => handleTaskDelete(task)}
      onSubtaskToggleStatus={(subtaskId, status) => updateSubtaskStatus(task.id, subtaskId, status)}
      onSubtaskUpdateTitle={(subtaskId, title) => updateSubtaskTitle(task.id, subtaskId, title)}
      onSubtaskDelete={(subtaskId) => removeSubtask(task.id, subtaskId)}
      onSubtaskAdd={(title) => createSubtask(task.id, title)}
      onSubtaskReorder={(subtaskId, afterId, beforeId) => reorderSubtask(task.id, subtaskId, afterId, beforeId)}
    />
  );

  if (isLoading) {
    return <ProjectDetailSkeleton />;
  }

  if (error || !project) {
    return (
      <div class="text-center py-12">
        <p class="text-red-600 mb-4">{error ?? "Project not found"}</p>
        <AppLink href="/" class="text-emerald-600 hover:text-emerald-700 font-medium">
          Go back
        </AppLink>
      </div>
    );
  }

  return (
    <div class="space-y-6">
      {/* Header */}
      <div class="flex items-center gap-4">
        <AppLink
          href="/"
          class="p-2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </AppLink>
        <div class="flex-1 min-w-0">
          <EditableText
            value={project.name}
            onSave={updateName}
            disabled={isArchived}
            textClassName="text-2xl font-bold text-neutral-900 dark:text-neutral-100"
          />
        </div>
        {!isArchived && (
          <IconButton
            icon={<Archive size={20} />}
            aria-label="Archive project"
            onClick={() => setShowArchiveProjectModal(true)}
          />
        )}
      </div>

      {/* Archived Banner */}
      {isArchived && (
        <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
          <p class="text-amber-800 dark:text-amber-200 mb-3">
            This project is archived and will be deleted in{" "}
            <span class="font-semibold">{getDaysUntilDeletion()} days</span>.
          </p>
          <div class="flex gap-2">
            <button
              type="button"
              onClick={() => setShowUnarchiveProjectModal(true)}
              class="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-neutral-800 border border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-300 rounded-lg hover:bg-amber-50 dark:hover:bg-neutral-700 transition-colors"
            >
              <ArchiveRestore size={16} />
              Unarchive
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteProjectModal(true)}
              class="flex items-center gap-2 px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <Trash2 size={16} />
              Permanently delete
            </button>
          </div>
        </div>
      )}

      {/* Task Form - only show when not archived */}
      {!isArchived && <TaskForm onSubmit={createTask} />}

      {/* Tasks */}
      {tasks.length === 0 ? (
        <EmptyState
          icon={<CheckSquare size={64} strokeWidth={1} />}
          title="No tasks yet"
          description="Create your first task to get started."
        />
      ) : (
        <div class="space-y-4">
          {/* Todo Tasks */}
          {(todoTasks.length > 0 || pendingTaskCount > 0) && (
            <div ref={todoContainerRef} class="space-y-4">
              {todoTasks.map(renderTaskCard)}
              {/* Pending Task Skeletons at bottom */}
              {Array.from({ length: pendingTaskCount }).map((_, i) => (
                <TaskCardSkeleton key={`pending-${i}`} />
              ))}
            </div>
          )}

          {/* Done Tasks Section */}
          {doneTasks.length > 0 && (
            <div class="space-y-4">
              {/* Separator / Toggle */}
              <button
                type="button"
                onClick={() => setShowDoneTasks(!showDoneTasks)}
                class="flex items-center gap-2 w-full py-2 text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
              >
                {showDoneTasks ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span class="font-medium">Done ({doneTasks.length})</span>
                <div class="flex-1 h-px bg-neutral-200 dark:bg-neutral-700" />
              </button>

              {/* Done Tasks List */}
              {showDoneTasks && (
                <div ref={doneContainerRef} class="space-y-4">
                  {doneTasks.map(renderTaskCard)}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Archive Project Modal */}
      <ArchiveConfirmModal
        isOpen={showArchiveProjectModal}
        onClose={() => setShowArchiveProjectModal(false)}
        onConfirm={handleArchiveProject}
        title="Archive Project"
        itemName={project.name}
        isLoading={isArchivingProject}
      />

      {/* Delete Task Modal */}
      <DeleteConfirmModal
        isOpen={taskToDelete !== null}
        onClose={() => setTaskToDelete(null)}
        onConfirm={handleDeleteTask}
        title="Delete Task"
        itemName={taskToDelete?.title ?? ""}
        isLoading={isDeletingTask}
      />

      {/* Unarchive Project Modal */}
      <ArchiveConfirmModal
        isOpen={showUnarchiveProjectModal}
        onClose={() => setShowUnarchiveProjectModal(false)}
        onConfirm={handleUnarchiveProject}
        title="Unarchive Project"
        itemName={project.name}
        isLoading={isUnarchivingProject}
        confirmText="Unarchive"
        message="This will restore the project and all its tasks. The automatic deletion timer will be canceled."
      />

      {/* Delete Project Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteProjectModal}
        onClose={() => setShowDeleteProjectModal(false)}
        onConfirm={handleDeleteProject}
        title="Delete Project"
        itemName={project.name}
        isLoading={isDeletingProject}
      />
    </div>
  );
};
