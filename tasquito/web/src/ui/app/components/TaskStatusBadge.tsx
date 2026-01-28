import type { TaskStatus } from "@broccoliapps/tasquito-shared";

type TaskStatusBadgeProps = {
  status: TaskStatus;
};

const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
  todo: {
    label: "To Do",
    className: "bg-neutral-100 text-neutral-700",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-blue-100 text-blue-700",
  },
  done: {
    label: "Done",
    className: "bg-emerald-100 text-emerald-700",
  },
};

export const TaskStatusBadge = ({ status }: TaskStatusBadgeProps) => {
  const config = statusConfig[status];

  return (
    <span class={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
      {config.label}
    </span>
  );
};
