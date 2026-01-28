import type { ComponentChildren } from "preact";

type ButtonProps = {
  children: ComponentChildren;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  type?: "button" | "submit";
  class?: string;
};

const variants = {
  primary:
    "bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:bg-indigo-400 dark:disabled:bg-indigo-700",
  secondary:
    "bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600 disabled:bg-neutral-50 dark:disabled:bg-neutral-800",
  danger:
    "bg-red-600 dark:bg-red-500 text-white hover:bg-red-700 dark:hover:bg-red-600 disabled:bg-red-400 dark:disabled:bg-red-700",
};

export const Button = ({
  children,
  onClick,
  variant = "primary",
  disabled = false,
  type = "button",
  class: className = "",
}: ButtonProps) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      class={`h-10 px-4 rounded-lg font-medium transition-colors disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};
