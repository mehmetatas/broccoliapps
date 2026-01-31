import type { JSX } from "preact";

type InputProps = Omit<JSX.HTMLAttributes<HTMLInputElement>, "size"> & {
  label?: string;
  error?: string;
  type?: string;
  disabled?: boolean;
  placeholder?: string;
  value?: string;
  maxLength?: number;
};

export const Input = ({ label, error, class: className, id, maxLength, value, ...props }: InputProps) => {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  const atLimit = maxLength != null && typeof value === "string" && value.length >= maxLength;

  return (
    <div class="w-full">
      {label && (
        <label htmlFor={inputId} class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
          {label}
        </label>
      )}
      <input
        {...props}
        value={value}
        maxLength={maxLength}
        id={inputId}
        class={`
          w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg
          bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500
          focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500
          disabled:bg-neutral-100 dark:disabled:bg-neutral-700 disabled:cursor-not-allowed
          ${error ? "border-red-500 focus:ring-red-500 focus:border-red-500" : ""}
          ${className ?? ""}
        `.trim()}
      />
      {error && <p class="mt-1 text-sm text-red-600">{error}</p>}
      {atLimit && !error && <p class="mt-1 text-xs text-neutral-400">Character limit reached</p>}
    </div>
  );
};
