import { useProject } from "@broccoliapps/tasquito-shared";
import { type ComponentChildren, createContext } from "preact";
import { useContext } from "preact/hooks";

type ProjectContextType = ReturnType<typeof useProject>;

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

type ProjectProviderProps = {
  projectId: string;
  children: ComponentChildren;
};

export const ProjectProvider = ({ projectId, children }: ProjectProviderProps) => {
  const value = useProject(projectId);
  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
};

export const useProjectContext = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProjectContext must be used within a ProjectProvider");
  }
  return context;
};
