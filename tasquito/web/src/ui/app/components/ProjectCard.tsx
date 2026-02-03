import type { ProjectSummaryDto } from "@broccoliapps/tasquito-shared";
import { Archive } from "lucide-preact";
import { AppLink } from "../SpaApp";
import { ProjectStatusIndicator } from "./ProjectStatusIndicator";

type ProjectCardProps = {
  project: ProjectSummaryDto;
};

export const ProjectCard = ({ project }: ProjectCardProps) => {
  const isArchived = project.isArchived;

  return (
    <AppLink
      href={`/projects/${project.id}`}
      class={`block bg-white dark:bg-neutral-800 rounded-lg border p-4 hover:shadow-sm transition-all ${
        isArchived
          ? "border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 opacity-75"
          : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600"
      }`}
    >
      <div class="relative space-y-2">
        <div class="absolute top-0 right-0">
          {isArchived ? (
            <div class="flex items-center gap-1 text-neutral-400">
              <Archive size={14} />
            </div>
          ) : (
            <ProjectStatusIndicator openTaskCount={project.openTaskCount} totalTaskCount={project.totalTaskCount} />
          )}
        </div>
        <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-1 pr-6">{project.name}</h3>
        <p class="text-sm text-neutral-400 dark:text-neutral-500">
          {isArchived ? "Archived" : project.totalTaskCount === 0 ? "No tasks" : `${project.openTaskCount} of ${project.totalTaskCount} open`}
        </p>
      </div>
    </AppLink>
  );
};
