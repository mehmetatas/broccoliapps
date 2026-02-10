import { DeleteConfirmModal, IconButton, useModal } from "@broccoliapps/browser";
import { LIMITS, type ProjectSummaryDto } from "@broccoliapps/tasquito-shared";
import { ArchiveRestore, Trash2 } from "lucide-preact";
import { AppLink } from "../SpaApp";

type ProjectCardProps = {
  project: ProjectSummaryDto;
  onDelete?: () => void;
  onUnarchive?: () => void;
};

export const ProjectCard = ({ project, onDelete, onUnarchive }: ProjectCardProps) => {
  const isArchived = !!project.isArchived;
  const deleteModal = useModal();

  const daysLeft = (() => {
    if (!project.archivedAt) {
      return LIMITS.ARCHIVE_TTL_DAYS;
    }
    const elapsed = Math.floor((Date.now() - project.archivedAt) / (1000 * 60 * 60 * 24));
    return Math.max(0, LIMITS.ARCHIVE_TTL_DAYS - elapsed);
  })();
  const summary = isArchived
    ? `Deleting ${daysLeft < 1 ? "soon" : `in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`}`
    : project.totalTaskCount === 0
      ? "No tasks"
      : `${project.openTaskCount} open tasks`;

  return (
    <div class="group flex items-center border-b border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 transition-colors">
      <AppLink href={`/projects/${project.id}`} class="flex-1 py-4 px-2">
        <div class="font-medium text-neutral-900 dark:text-neutral-100">{project.name}</div>
        <div class="text-sm text-neutral-500 dark:text-neutral-400">{summary}</div>
      </AppLink>
      {(onUnarchive || onDelete) && (
        <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mr-2">
          {onUnarchive && (
            <IconButton icon={<ArchiveRestore size={16} />} title="Unarchive project" aria-label="Unarchive project" size="sm" onClick={onUnarchive} />
          )}
          {onDelete && (
            <>
              <IconButton
                icon={<Trash2 size={16} />}
                title="Delete project"
                aria-label="Delete project"
                variant="danger"
                size="sm"
                onClick={() => deleteModal.open()}
              />
              <DeleteConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={deleteModal.close}
                onConfirm={() => {
                  onDelete();
                  deleteModal.close();
                }}
                title="Delete Project"
                itemName={project.name}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
};
