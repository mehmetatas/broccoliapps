import type { ComponentChildren, HTMLAttributes, Ref } from "preact";
import { forwardRef } from "preact/compat";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ComponentChildren;
  onClick?: () => void;
  hoverable?: boolean;
};

export const Card = forwardRef<HTMLDivElement, CardProps>(({ children, onClick, hoverable = false, class: className, ...props }, ref: Ref<HTMLDivElement>) => {
  return (
    <div
      ref={ref}
      {...props}
      onClick={onClick}
      class={`
          bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-3
          ${hoverable || onClick ? "cursor-pointer hover:border-neutral-300 dark:hover:border-neutral-600 hover:shadow-sm transition-all" : ""}
          ${className ?? ""}
        `.trim()}
    >
      {children}
    </div>
  );
});
