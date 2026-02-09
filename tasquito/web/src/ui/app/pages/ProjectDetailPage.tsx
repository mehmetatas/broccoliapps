import { ArchiveConfirmModal, Button, DeleteConfirmModal, EditableText, EmptyState, Skeleton, useDragAndDrop, useModal } from "@broccoliapps/browser";
import { LIMITS } from "@broccoliapps/tasquito-shared";
import { Archive, ArchiveRestore, CheckSquare, Trash2 } from "lucide-preact";
import { route } from "preact-router";
import { PageHeader, TaskCard, TaskForm } from "../components";
import { ProjectProvider, useProjectContext } from "../context/ProjectContext";

type ProjectDetailPageProps = {
  id?: string;
};

export const ProjectDetailPage = ({ id }: ProjectDetailPageProps) => {
  if (!id) {
    return null;
  }

  return (
    <ProjectProvider projectId={id}>
      <ProjectDetailContent />
    </ProjectProvider>
  );
};

const ProjectDetailContent = () => {
  const {
    project,
    tasks,
    isLoading,
    error,
    limitError,
    clearLimitError,
    pendingTaskIds,
    pendingSubtaskIds,
    updateName,
    remove,
    archive,
    unarchive,
    createTask,
    reorderTask,
  } = useProjectContext();

  const archiveModal = useModal();
  const deleteModal = useModal();

  const isArchived = !!project?.isArchived;

  const todoTasks = tasks.filter((t) => t.status === "todo");
  const doneTasks = tasks.filter((t) => t.status === "done");

  const { containerRef } = useDragAndDrop({
    items: todoTasks,
    onReorder: reorderTask,
    disabled: isArchived,
  });

  const handleArchive = async () => {
    await archive();
    archiveModal.close();
    route("/app");
  };

  const handleDelete = async () => {
    await remove();
    deleteModal.close();
    route("/app");
  };

  const handleUnarchive = async () => {
    try {
      await unarchive();
    } catch {
      // limitError handled by hook
    }
  };

  // Archived banner with days remaining
  const archivedBanner = () => {
    if (!project?.archivedAt) {
      return null;
    }
    const daysRemaining = Math.max(0, LIMITS.ARCHIVE_TTL_DAYS - Math.floor((Date.now() - project.archivedAt) / (1000 * 60 * 60 * 24)));
    return (
      <div class="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 space-y-3">
        <p class="text-sm text-orange-800 dark:text-orange-200">
          This project is archived and will be automatically deleted in <strong>{daysRemaining} days</strong>.
        </p>
        <div class="flex gap-2">
          <Button variant="warning" size="sm" onClick={handleUnarchive}>
            <ArchiveRestore size={16} class="mr-1.5" />
            Unarchive
          </Button>
          <Button variant="danger" size="sm" onClick={() => deleteModal.open()}>
            <Trash2 size={16} class="mr-1.5" />
            Delete
          </Button>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div class="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (error || !project) {
    return <div class="text-red-600 dark:text-red-400 text-center py-8">{error ?? "Project not found"}</div>;
  }

  return (
    <div class="space-y-4">
      {/* Header */}
      <PageHeader
        title={
          <EditableText
            value={project.name}
            onSave={updateName}
            disabled={isArchived}
            maxLength={LIMITS.MAX_PROJECT_NAME_LENGTH}
            className="text-2xl font-bold"
            textClassName="text-2xl font-bold text-neutral-900 dark:text-neutral-100"
          />
        }
        backHref={isArchived ? "/?archived=true" : "/"}
        actions={
          !isArchived && (
            <button
              type="button"
              onClick={() => archiveModal.open()}
              class="p-1.5 rounded-lg text-neutral-400 hover:text-orange-500 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              aria-label="Archive project"
            >
              <Archive size={18} />
            </button>
          )
        }
      />

      {/* Archived banner */}
      {isArchived && archivedBanner()}

      {/* Limit error */}
      {limitError && (
        <div class="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3 flex items-start gap-3">
          <p class="text-sm text-orange-800 dark:text-orange-200 flex-1">{limitError}</p>
          <button type="button" onClick={clearLimitError} class="text-orange-600 dark:text-orange-400 hover:text-orange-800 text-sm font-medium shrink-0">
            Dismiss
          </button>
        </div>
      )}

      {/* Task form */}
      {!isArchived && <TaskForm onSubmit={createTask} />}

      {/* Todo tasks - draggable */}
      {todoTasks.length === 0 && doneTasks.length === 0 ? (
        <EmptyState icon={<CheckSquare size={64} strokeWidth={1} />} title="No tasks yet" description="Add your first task to get started." />
      ) : (
        <>
          <div ref={containerRef}>
            {todoTasks.map((task) => (
              <TaskCard key={task.id} task={task} isArchived={isArchived} pending={pendingTaskIds.has(task.id)} pendingSubtaskIds={pendingSubtaskIds} />
            ))}
          </div>

          {/* Done tasks */}
          {doneTasks.length > 0 && (
            <div>
              {doneTasks.map((task) => (
                <TaskCard key={task.id} task={task} isArchived={isArchived} pending={pendingTaskIds.has(task.id)} pendingSubtaskIds={pendingSubtaskIds} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <ArchiveConfirmModal
        isOpen={archiveModal.isOpen}
        onClose={archiveModal.close}
        onConfirm={handleArchive}
        title="Archive Project"
        itemName={project.name}
      />
      <DeleteConfirmModal isOpen={deleteModal.isOpen} onClose={deleteModal.close} onConfirm={handleDelete} title="Delete Project" itemName={project.name} />
    </div>
  );
};
