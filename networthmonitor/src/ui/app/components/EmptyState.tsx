import type { ComponentChildren } from "preact";

type EmptyStateProps = {
  icon?: ComponentChildren;
  title: string;
  description?: string;
};

export const EmptyState = ({
  icon,
  title,
  description,
}: EmptyStateProps) => {
  return (
    <div class="text-center py-12">
      {icon && (
        <div class="mx-auto text-neutral-300 dark:text-neutral-600 mb-4 w-12 h-12 flex items-center justify-center">
          {icon}
        </div>
      )}
      <p class="text-neutral-500 dark:text-neutral-400">
        {title}
      </p>
      {description && (
        <p class="text-sm text-neutral-400 dark:text-neutral-500 mt-2">
          {description}
        </p>
      )}
    </div>
  );
};
