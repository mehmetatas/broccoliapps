import type { JSX } from "preact";

type InputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "number";
} & Omit<JSX.HTMLAttributes<HTMLInputElement>, "onChange" | "value" | "type">;

export const Input = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  ...rest
}: InputProps) => {
  return (
    <div class="flex flex-col gap-1.5">
      <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onInput={(e) => onChange((e.target as HTMLInputElement).value)}
        placeholder={placeholder}
        class="h-10 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-colors"
        {...rest}
      />
    </div>
  );
};
