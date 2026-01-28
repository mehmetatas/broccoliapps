import type { ComponentChildren } from "preact";
import { AppLink } from "../SpaApp";

type PageHeaderProps = {
  title: string;
  subtitle?: ComponentChildren;
  backHref?: string;
  onBack?: () => void;
  action?: { icon: "plus"; href: string };
};

const PlusIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    class="h-5 w-5"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fill-rule="evenodd"
      d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
      clip-rule="evenodd"
    />
  </svg>
);

const BackIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    class="h-5 w-5"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fill-rule="evenodd"
      d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
      clip-rule="evenodd"
    />
  </svg>
);

export const PageHeader = ({
  title,
  subtitle,
  backHref,
  onBack,
  action,
}: PageHeaderProps) => {
  return (
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        {backHref && (
          <AppLink
            href={backHref}
            class="p-2 rounded-lg text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
          >
            <BackIcon />
          </AppLink>
        )}
        {onBack && !backHref && (
          <button
            onClick={onBack}
            class="p-2 rounded-lg text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
          >
            <BackIcon />
          </button>
        )}
        <div>
          <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {title}
          </h1>
          {subtitle && (
            <div class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{subtitle}</div>
          )}
        </div>
      </div>
      {action && (
        <AppLink
          href={action.href}
          class="p-2 rounded-lg bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
        >
          {action.icon === "plus" && <PlusIcon />}
        </AppLink>
      )}
    </div>
  );
};
