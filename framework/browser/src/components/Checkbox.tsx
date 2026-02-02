import { Circle, CircleCheck, Loader2 } from "lucide-preact";

type CheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  loading?: boolean;
  label?: string;
  strikethrough?: boolean;
  size?: "sm" | "md";
};

export const Checkbox = ({
  checked,
  onChange,
  disabled = false,
  loading = false,
  label,
  strikethrough = true,
  size = "md",
}: CheckboxProps) => {
  const iconSize = size === "sm" ? 16 : 20;

  return (
    <label
      class={`
        inline-flex items-center gap-2 cursor-pointer select-none
        ${disabled || loading ? "opacity-50 cursor-not-allowed" : ""}
      `.trim()}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={disabled || loading}
        onClick={() => !disabled && !loading && onChange(!checked)}
        class={`
          flex items-center justify-center shrink-0
          transition-colors focus:outline-none
          ${disabled || loading ? "cursor-not-allowed" : "cursor-pointer"}
        `.trim()}
      >
        {loading ?
          <Loader2 size={iconSize} class="text-neutral-400 dark:text-neutral-500 animate-spin" />
          : checked ?
            <CircleCheck size={iconSize} class="text-emerald-500" />
            :
            <Circle size={iconSize} class="text-neutral-300 dark:text-neutral-600 hover:text-neutral-400 dark:hover:text-neutral-500" />
        }
      </button>
      {label && (
        <span
          class={`
            text-sm text-neutral-700 dark:text-neutral-300
            ${checked && strikethrough ? "line-through text-neutral-400 dark:text-neutral-500" : ""}
          `.trim()}
        >
          {label}
        </span>
      )}
    </label>
  );
};
