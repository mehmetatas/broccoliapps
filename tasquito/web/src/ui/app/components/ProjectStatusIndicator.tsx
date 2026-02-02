import { Check, Clock, Loader } from "lucide-preact";

type ProjectStatus = "todo" | "in_progress" | "done";

type ProjectStatusIndicatorProps = {
  openTaskCount: number;
  totalTaskCount: number;
};

const getStatus = (openTaskCount: number, totalTaskCount: number): ProjectStatus => {
  if (totalTaskCount === 0) {
    return "todo";
  }
  if (openTaskCount === 0) {
    return "done";
  }
  return "in_progress";
};

const statusConfig: Record<ProjectStatus, { icon: typeof Clock; color: string; label: string }> = {
  todo: {
    icon: Clock,
    color: "text-neutral-400",
    label: "No tasks",
  },
  in_progress: {
    icon: Loader,
    color: "text-blue-500",
    label: "In progress",
  },
  done: {
    icon: Check,
    color: "text-emerald-500",
    label: "Completed",
  },
};

export const ProjectStatusIndicator = ({ openTaskCount, totalTaskCount }: ProjectStatusIndicatorProps) => {
  const status = getStatus(openTaskCount, totalTaskCount);
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span title={config.label} class={config.color}>
      <Icon size={18} />
    </span>
  );
};
