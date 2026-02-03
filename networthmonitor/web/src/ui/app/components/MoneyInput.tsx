import { Check, Loader2, X } from "lucide-preact";

type MoneyInputProps = {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  onBlur?: () => void;
  onKeyDown?: (e: KeyboardEvent) => void;
  placeholder?: string;
  label?: string;
  status?: "saving" | "saved" | undefined;
  currency?: string;
  prefix?: string;
  disabled?: boolean;
};

export const MoneyInput = ({ value, onChange, onBlur, onKeyDown, placeholder = "0", label, status, currency, prefix, disabled }: MoneyInputProps) => {
  const handleChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const rawValue = input.value.replace(/[^0-9.-]/g, "");
    if (rawValue === "" || rawValue === "-") {
      onChange(undefined);
    } else {
      const num = parseFloat(rawValue);
      if (!isNaN(num)) {
        onChange(num);
      }
    }
  };

  return (
    <div class="flex flex-col gap-1.5">
      {label && <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300">{label}</label>}
      <div class="flex items-center gap-0">
        {prefix && (
          <span class="w-22 h-10 px-3 flex items-center bg-neutral-100 dark:bg-neutral-700 border border-r-0 border-neutral-200 dark:border-neutral-700 rounded-l-lg text-sm font-medium text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
            {prefix}
          </span>
        )}
        <div class="relative flex-1">
          <input
            type="text"
            inputMode="numeric"
            value={value !== undefined ? value.toLocaleString("en-US") : ""}
            onInput={handleChange}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            class={`w-full h-10 pl-3 ${value !== undefined && status ? "pr-16" : "pr-9"} border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-colors ${
              prefix && currency ? "" : prefix ? "rounded-r-lg" : currency ? "rounded-l-lg" : "rounded-lg"
            } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
          />
          {!status && value !== undefined && !disabled && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => onChange(undefined)}
              class={`absolute top-1/2 -translate-y-1/2 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 ${status ? "right-9" : "right-3"}`}
            >
              <X class="h-4 w-4" />
            </button>
          )}
          {status && (
            <span class="absolute right-3 top-1/2 -translate-y-1/2">
              {status === "saving" && <Loader2 class="animate-spin h-4 w-4 text-indigo-500" />}
              {status === "saved" && <Check class="h-4 w-4 text-green-500" />}
            </span>
          )}
        </div>
        {currency && (
          <span class="h-10 px-3 flex items-center bg-neutral-100 dark:bg-neutral-700 border border-l-0 border-neutral-200 dark:border-neutral-700 rounded-r-lg text-sm font-medium text-neutral-600 dark:text-neutral-400">
            {currency}
          </span>
        )}
      </div>
    </div>
  );
};
