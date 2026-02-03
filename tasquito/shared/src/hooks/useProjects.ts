import { useCallback, useEffect, useState } from "react";
import type { ProjectSummaryDto } from "../api-contracts";
import { archiveProject, deleteProject, getProjects, invalidateProjectsCache, postProject } from "../client";

export const useProjects = () => {
  const [projects, setProjects] = useState<ProjectSummaryDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limitError, setLimitError] = useState<string | null>(null);

  const clearLimitError = useCallback(() => setLimitError(null), []);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getProjects();
      const sorted = [...data.projects].sort((a, b) => a.name.localeCompare(b.name));
      setProjects(sorted);
    } catch (err) {
      console.error(err);
      setError("Failed to load projects");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = useCallback(async (name: string) => {
    try {
      const result = await postProject({ name });
      const newProject: ProjectSummaryDto = {
        ...result.project,
        openTaskCount: 0,
        totalTaskCount: 0,
      };
      setProjects((prev) => [...prev, newProject].sort((a, b) => a.name.localeCompare(b.name)));
      return result.project;
    } catch (err: unknown) {
      const error = err as { status?: number; message?: string };
      if (error?.status === 403 && error?.message) {
        setLimitError(error.message);
      }
      throw err;
    }
  }, []);

  const archive = useCallback(async (id: string) => {
    const result = await archiveProject(id);
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, isArchived: result.project.isArchived, archivedAt: result.project.archivedAt } : p)));
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const refresh = useCallback(() => {
    invalidateProjectsCache();
    load();
  }, [load]);

  return {
    projects,
    isLoading,
    error,
    limitError,
    clearLimitError,
    create,
    archive,
    remove,
    refresh,
  };
};
