import type { TaskDto } from "@broccoliapps/tasquito-shared";
import { TaskActions } from "./TaskActions";
import { TaskStatusBadge } from "./TaskStatusBadge";

type TaskTableProps = {
  tasks: TaskDto[];
  onRowClick: (task: TaskDto) => void;
  onEdit: (task: TaskDto) => void;
  onDelete: (task: TaskDto) => void;
};

export const TaskTable = ({ tasks, onRowClick, onEdit, onDelete }: TaskTableProps) => {
  if (tasks.length === 0) {
    return (
      <div class="text-center py-12 text-neutral-500">
        <p class="text-lg">No tasks yet</p>
        <p class="text-sm mt-1">Create your first task above</p>
      </div>
    );
  }

  return (
    <div class="overflow-hidden rounded-lg border border-neutral-200 bg-white">
      <table class="min-w-full divide-y divide-neutral-200">
        <thead class="bg-neutral-50">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Title
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Status
            </th>
            <th class="px-4 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-neutral-200">
          {tasks.map((task) => (
            <tr
              key={task.id}
              onClick={() => onRowClick(task)}
              class="hover:bg-neutral-50 cursor-pointer transition-colors"
            >
              <td class="px-4 py-3 text-sm text-neutral-900">
                <span class={task.status === "done" ? "line-through text-neutral-500" : ""}>
                  {task.title}
                </span>
              </td>
              <td class="px-4 py-3">
                <TaskStatusBadge status={task.status} />
              </td>
              <td class="px-4 py-3 text-right">
                <TaskActions onEdit={() => onEdit(task)} onDelete={() => onDelete(task)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
