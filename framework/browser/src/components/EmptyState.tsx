import type { ComponentChildren } from "preact";
import { FolderOpen } from "lucide-preact";

type EmptyStateProps = {
  icon?: ComponentChildren;
  title: string;
  description?: string;
  action?: ComponentChildren;
};

export const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => {
  return (
    <div class="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div class="w-16 h-16 mb-4 text-neutral-300 dark:text-neutral-600">
        {icon ?? <FolderOpen size={64} strokeWidth={1} />}
      </div>
      <h3 class="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-1">{title}</h3>
      {description && <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4 max-w-sm">{description}</p>}
      {action && <div class="mt-2">{action}</div>}
    </div>
  );
};
