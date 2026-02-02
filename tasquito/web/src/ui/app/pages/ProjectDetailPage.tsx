import { ArchiveConfirmModal, DeleteConfirmModal, EditableText, EmptyState, IconButton, useDragAndDrop, useModal } from "@broccoliapps/browser";
import { LIMITS, type TaskDto } from "@broccoliapps/tasquito-shared";
import autoAnimate, { type AnimationController } from "@formkit/auto-animate";
import { Archive, ArchiveRestore, ArrowLeft, CheckSquare, ChevronDown, ChevronRight, Trash2, X } from "lucide-preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { ProjectDetailSkeleton, TaskCard, TaskCardSkeleton, TaskForm } from "../components";
import { useProject } from "../hooks";
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
    limitError,
    clearLimitError,
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

  // Auto-animate for todo tasks (imperative - shares ref with SortableJS)
  const todoAnimateRef = useRef<AnimationController | null>(null);
  const { containerRef: todoContainerRef } = useDragAndDrop({
    items: todoTasks,
    onReorder: reorderTask,
    disabled: isArchived,
    onDragStateChange: (isDragging) => {
      if (isDragging) {
        todoAnimateRef.current?.disable();
      } else {
        todoAnimateRef.current?.enable();
      }
    },
  });

  useEffect(() => {
    const el = todoContainerRef.current;
    if (el) {
      if (!todoAnimateRef.current || todoAnimateRef.current.parent !== el) {
        todoAnimateRef.current?.destroy?.();
        todoAnimateRef.current = autoAnimate(el, { duration: 200, easing: "ease-out", disrespectUserMotionPreference: true });
      }
    } else if (todoAnimateRef.current) {
      todoAnimateRef.current.destroy?.();
      todoAnimateRef.current = null;
    }
  });

  // Auto-animate for done tasks (imperative - container is conditionally rendered)
  const doneContainerRef = useRef<HTMLDivElement>(null);
  const doneAnimateRef = useRef<AnimationController | null>(null);

  useEffect(() => {
    const el = doneContainerRef.current;
    if (el) {
      if (!doneAnimateRef.current || doneAnimateRef.current.parent !== el) {
        doneAnimateRef.current?.destroy?.();
        doneAnimateRef.current = autoAnimate(el, { duration: 200, easing: "ease-out", disrespectUserMotionPreference: true });
      }
    } else if (doneAnimateRef.current) {
      doneAnimateRef.current.destroy?.();
      doneAnimateRef.current = null;
    }
  });

  const archiveModal = useModal();
  const [isArchivingProject, setIsArchivingProject] = useState(false);
  const unarchiveModal = useModal();
  const [isUnarchivingProject, setIsUnarchivingProject] = useState(false);
  const deleteProjectModal = useModal();
  const [isDeletingProject, setIsDeletingProject] = useState(false);
  const deleteTaskModal = useModal<TaskWithSubtasks>();
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
      unarchiveModal.close();
    } catch (err: unknown) {
      // Close modal on limit error so user can see the error banner
      const error = err as { status?: number };
      if (error?.status === 403) {
        unarchiveModal.close();
      }
      // Keep modal open on other errors
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
    if (!project?.archivedAt) {
return null;
}
    const twoWeeksMs = 14 * 24 * 60 * 60 * 1000;
    const deletionTime = project.archivedAt + twoWeeksMs;
    const now = Date.now();
    const daysRemaining = Math.ceil((deletionTime - now) / (24 * 60 * 60 * 1000));

    return Math.max(0, daysRemaining);
  };

  const handleDeleteTask = () => {
    if (!deleteTaskModal.data) {
 return; 
}
    setIsDeletingTask(true);
    try {
      removeTask(deleteTaskModal.data.id);
      deleteTaskModal.close();
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
      deleteTaskModal.open(task);
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
            maxLength={LIMITS.MAX_PROJECT_NAME_LENGTH}
            textClassName="text-2xl font-bold text-neutral-900 dark:text-neutral-100"
          />
        </div>
        {!isArchived && (
          <IconButton
            icon={<Archive size={20} />}
            aria-label="Archive project"
            onClick={() => archiveModal.open()}
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
              onClick={() => unarchiveModal.open()}
              class="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-neutral-800 border border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-300 rounded-lg hover:bg-amber-50 dark:hover:bg-neutral-700 transition-colors"
            >
              <ArchiveRestore size={16} />
              Unarchive
            </button>
            <button
              type="button"
              onClick={() => deleteProjectModal.open()}
              class="flex items-center gap-2 px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <Trash2 size={16} />
              Permanently delete
            </button>
          </div>
        </div>
      )}

      {/* Limit Error Banner */}
      {limitError && (
        <div class="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-4 flex items-start gap-3">
          <div class="flex-1 text-orange-800 dark:text-orange-200 text-sm">{limitError}</div>
          <button
            type="button"
            onClick={clearLimitError}
            class="text-orange-500 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-200 transition-colors"
            aria-label="Dismiss"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Task Form - only show when not archived */}
      {!isArchived && <TaskForm onSubmit={createTask} />}

      {/* Tasks */}
      {tasks.length === 0 && pendingTaskCount === 0 ? (
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
        isOpen={archiveModal.isOpen}
        onClose={archiveModal.close}
        onConfirm={handleArchiveProject}
        title="Archive Project"
        itemName={project.name}
        isLoading={isArchivingProject}
      />

      {/* Delete Task Modal */}
      <DeleteConfirmModal
        isOpen={deleteTaskModal.isOpen}
        onClose={deleteTaskModal.close}
        onConfirm={handleDeleteTask}
        title="Delete Task"
        itemName={deleteTaskModal.data?.title ?? ""}
        isLoading={isDeletingTask}
      />

      {/* Unarchive Project Modal */}
      <ArchiveConfirmModal
        isOpen={unarchiveModal.isOpen}
        onClose={unarchiveModal.close}
        onConfirm={handleUnarchiveProject}
        title="Unarchive Project"
        itemName={project.name}
        isLoading={isUnarchivingProject}
        confirmText="Unarchive"
        message="This will restore the project and all its tasks. The automatic deletion timer will be canceled."
      />

      {/* Delete Project Modal */}
      <DeleteConfirmModal
        isOpen={deleteProjectModal.isOpen}
        onClose={deleteProjectModal.close}
        onConfirm={handleDeleteProject}
        title="Delete Project"
        itemName={project.name}
        isLoading={isDeletingProject}
      />
    </div>
  );
};
