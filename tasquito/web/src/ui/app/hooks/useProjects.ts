import { useEffect, useState } from "preact/hooks";
import type { ProjectSummaryDto } from "@broccoliapps/tasquito-shared";
import { archiveProject, deleteProject, getProjects, invalidateProjectsCache, postProject } from "../api";

export const useProjects = () => {
  const [projects, setProjects] = useState<ProjectSummaryDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limitError, setLimitError] = useState<string | null>(null);

  const clearLimitError = () => setLimitError(null);

  const load = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getProjects();
      const sorted = [...data.projects].sort((a, b) => a.name.localeCompare(b.name));
      setProjects(sorted);
    } catch (err) {
      setError("Failed to load projects");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async (name: string) => {
    try {
      const result = await postProject({ name });
      const newProject = { ...result.project, openTaskCount: 0, totalTaskCount: 0 };
      setProjects((prev) => [...prev, newProject].sort((a, b) => a.name.localeCompare(b.name)));
      return result.project;
    } catch (err: unknown) {
      // Check for limit error (403)
      const error = err as { status?: number; message?: string };
      if (error?.status === 403 && error?.message) {
        setLimitError(error.message);
      }
      throw err;
    }
  };

  const remove = async (id: string) => {
    await deleteProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const archive = async (id: string) => {
    const result = await archiveProject(id);
    setProjects((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, isArchived: result.project.isArchived, archivedAt: result.project.archivedAt } : p
      )
    );
  };

  const refresh = () => {
    invalidateProjectsCache();
    load();
  };

  return {
    projects,
    isLoading,
    error,
    limitError,
    clearLimitError,
    create,
    remove,
    archive,
    refresh,
  };
};
