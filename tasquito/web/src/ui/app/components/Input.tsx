import type { JSX } from "preact";

type InputProps = Omit<JSX.HTMLAttributes<HTMLInputElement>, "size"> & {
  label?: string;
  error?: string;
  type?: string;
  disabled?: boolean;
  placeholder?: string;
  value?: string;
};

export const Input = ({ label, error, class: className, id, ...props }: InputProps) => {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div class="w-full">
      {label && (
        <label htmlFor={inputId} class="block text-sm font-medium text-neutral-700 mb-1">
          {label}
        </label>
      )}
      <input
        {...props}
        id={inputId}
        class={`
          w-full px-3 py-2 border border-neutral-300 rounded-lg
          text-neutral-900 placeholder-neutral-400
          focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500
          disabled:bg-neutral-100 disabled:cursor-not-allowed
          ${error ? "border-red-500 focus:ring-red-500 focus:border-red-500" : ""}
          ${className ?? ""}
        `.trim()}
      />
      {error && <p class="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};
