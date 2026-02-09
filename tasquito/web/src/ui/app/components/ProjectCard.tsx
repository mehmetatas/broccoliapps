import { DeleteConfirmModal, IconButton, useModal } from "@broccoliapps/browser";
import type { ProjectSummaryDto } from "@broccoliapps/tasquito-shared";
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

  const summary = isArchived ? "Archived" : project.totalTaskCount === 0 ? "No tasks" : `${project.openTaskCount} of ${project.totalTaskCount} open`;

  return (
    <div class="group flex items-center border-b border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 transition-colors">
      <AppLink href={`/projects/${project.id}`} class="flex-1 py-4 px-2">
        <div class="font-medium text-neutral-900 dark:text-neutral-100">{project.name}</div>
        <div class="text-sm text-neutral-500 dark:text-neutral-400">{summary}</div>
      </AppLink>
      {(onUnarchive || onDelete) && (
        <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mr-2">
          {onUnarchive && <IconButton icon={<ArchiveRestore size={16} />} aria-label="Unarchive project" size="sm" onClick={onUnarchive} />}
          {onDelete && (
            <>
              <IconButton icon={<Trash2 size={16} />} aria-label="Delete project" variant="danger" size="sm" onClick={() => deleteModal.open()} />
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
