import { EmptyState } from "@broccoliapps/browser";
import type { ProjectSummaryDto } from "@broccoliapps/tasquito-shared";
import { Archive, Check, Clock, LayoutGrid, Loader } from "lucide-preact";
import { ProjectCard } from "./ProjectCard";
import { ProjectGridSkeleton } from "./Skeleton";

type ProjectFilter = "all" | "active" | "pending" | "done" | "archived";

type ProjectListProps = {
  projects: ProjectSummaryDto[];
  isLoading: boolean;
  filter: ProjectFilter;
};

const emptyStateConfig: Record<ProjectFilter, { icon: preact.JSX.Element; title: string; description: string }> = {
  all: {
    icon: <LayoutGrid size={64} strokeWidth={1} />,
    title: "No projects yet",
    description: "Create your first project to start organizing your tasks.",
  },
  active: {
    icon: <Loader size={64} strokeWidth={1} />,
    title: "No active projects",
    description: "Projects with tasks in progress will appear here.",
  },
  pending: {
    icon: <Clock size={64} strokeWidth={1} />,
    title: "No pending projects",
    description: "Projects without any tasks will appear here.",
  },
  done: {
    icon: <Check size={64} strokeWidth={1} />,
    title: "No completed projects",
    description: "Projects with all tasks completed will appear here.",
  },
  archived: {
    icon: <Archive size={64} strokeWidth={1} />,
    title: "No archived projects",
    description: "Archived projects will appear here. They are automatically deleted after 2 weeks.",
  },
};

export const ProjectList = ({ projects, isLoading, filter }: ProjectListProps) => {
  if (isLoading) {
    return <ProjectGridSkeleton count={6} />;
  }

  if (projects.length === 0) {
    const config = emptyStateConfig[filter];
    return <EmptyState icon={config.icon} title={config.title} description={config.description} />;
  }

  return (
    <div class="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
};
