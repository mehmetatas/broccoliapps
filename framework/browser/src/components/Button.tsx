import type { ComponentChildren, HTMLAttributes } from "preact";

type ButtonVariant = "primary" | "secondary" | "danger" | "warning";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = Omit<HTMLAttributes<HTMLButtonElement>, "size"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  children?: ComponentChildren;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500",
  secondary: "bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-neutral-600 focus:ring-neutral-400",
  danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
  warning: "bg-orange-500 text-white hover:bg-orange-600 focus:ring-orange-400",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export const Button = ({
  variant = "primary",
  size = "md",
  class: className,
  disabled,
  children,
  ...props
}: ButtonProps) => {
  return (
    <button
      {...props}
      disabled={disabled}
      class={`
        inline-flex items-center justify-center font-medium rounded-lg
        transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className ?? ""}
      `.trim()}
    >
      {children}
    </button>
  );
};
