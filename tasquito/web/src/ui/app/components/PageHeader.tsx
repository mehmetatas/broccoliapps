import { ChevronLeft } from "lucide-preact";
import type { ComponentChildren } from "preact";
import { AppLink } from "../SpaApp";

type PageHeaderProps = {
  title: ComponentChildren;
  backHref?: string;
  actions?: ComponentChildren;
};

export const PageHeader = ({ title, backHref, actions }: PageHeaderProps) => {
  return (
    <div class="flex items-start gap-3 mb-6">
      {backHref && (
        <AppLink
          href={backHref}
          class="mt-0.25 rounded-lg text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
        >
          <ChevronLeft size={28} />
        </AppLink>
      )}
      <div class="flex-1 min-w-0">{title}</div>
      {actions && <div class="shrink-0">{actions}</div>}
    </div>
  );
};
