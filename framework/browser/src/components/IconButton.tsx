import type { ComponentChildren, HTMLAttributes } from "preact";

type IconButtonVariant = "default" | "danger" | "ghost";
type IconButtonSize = "sm" | "md" | "lg";

type IconButtonProps = Omit<HTMLAttributes<HTMLButtonElement>, "size"> & {
  icon: ComponentChildren;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  disabled?: boolean;
  "aria-label": string;
};

const variantClasses: Record<IconButtonVariant, string> = {
  default: "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700",
  danger: "text-neutral-500 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30",
  ghost: "text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300",
};

const sizeClasses: Record<IconButtonSize, string> = {
  sm: "p-1",
  md: "p-1.5",
  lg: "p-2",
};

export const IconButton = ({
  icon,
  variant = "default",
  size = "md",
  disabled,
  class: className,
  ...props
}: IconButtonProps) => {
  return (
    <button
      {...props}
      type="button"
      disabled={disabled}
      class={`
        inline-flex items-center justify-center rounded-lg
        transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-emerald-500
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className ?? ""}
      `.trim()}
    >
      {icon}
    </button>
  );
};
