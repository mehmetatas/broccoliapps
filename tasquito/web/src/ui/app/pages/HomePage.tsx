import { EmptyState, Skeleton, useToast } from "@broccoliapps/browser";
import { useProjects } from "@broccoliapps/tasquito-shared";
import { CheckSquare } from "lucide-preact";
import { useEffect } from "preact/hooks";
import { route } from "preact-router";
import { PageHeader, ProjectCard, ProjectForm } from "../components";

export const HomePage = () => {
  const { projects, isLoading, error, limitError, clearLimitError, create, remove, unarchive } = useProjects();
  const toast = useToast();

  useEffect(() => {
    if (limitError) {
      toast.warning(limitError);
      clearLimitError();
    }
  }, [limitError, clearLimitError, toast]);

  const isArchived = new URLSearchParams(window.location.search).get("archived") === "true";
  const filtered = projects.filter((p) => (isArchived ? !!p.isArchived : !p.isArchived));

  const handleCreate = async (name: string) => {
    const project = await create(name);
    route(`/app/projects/${project.id}`);
  };

  if (isLoading) {
    return (
      <div class="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (error) {
    return <div class="text-red-600 dark:text-red-400 text-center py-8">{error}</div>;
  }

  return (
    <div class="space-y-4">
      {/* Create project form or archived header */}
      {isArchived ? (
        <PageHeader title={<h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Archived projects</h2>} backHref="/" />
      ) : (
        <ProjectForm onSubmit={handleCreate} />
      )}

      {/* Project list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<CheckSquare size={64} strokeWidth={1} />}
          title={isArchived ? "No archived projects" : "No projects yet"}
          description={isArchived ? undefined : "Create your first project to get started."}
        />
      ) : (
        <div>
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onDelete={isArchived ? () => remove(project.id) : undefined}
              onUnarchive={isArchived ? () => unarchive(project.id) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
};
