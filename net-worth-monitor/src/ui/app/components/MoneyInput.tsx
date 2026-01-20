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

const Spinner = () => (
  <svg
    class="animate-spin h-4 w-4 text-indigo-500"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      class="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      stroke-width="4"
    />
    <path
      class="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

const CheckIcon = () => (
  <svg
    class="h-4 w-4 text-green-500"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fill-rule="evenodd"
      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
      clip-rule="evenodd"
    />
  </svg>
);

const ClearIcon = () => (
  <svg
    class="h-4 w-4"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fill-rule="evenodd"
      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
      clip-rule="evenodd"
    />
  </svg>
);

export const MoneyInput = ({
  value,
  onChange,
  onBlur,
  onKeyDown,
  placeholder = "0",
  label,
  status,
  currency,
  prefix,
  disabled,
}: MoneyInputProps) => {
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
      {label && (
        <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {label}
        </label>
      )}
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
            class={`w-full h-10 pl-3 ${value !== undefined && status ? "pr-16" : "pr-9"} border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-colors ${prefix && currency ? "" : prefix ? "rounded-r-lg" : currency ? "rounded-l-lg" : "rounded-lg"
              } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
          />
          {value !== undefined && !disabled && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => onChange(undefined)}
              class={`absolute top-1/2 -translate-y-1/2 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 ${status ? "right-9" : "right-3"}`}
            >
              <ClearIcon />
            </button>
          )}
          {status && (
            <span class="absolute right-3 top-1/2 -translate-y-1/2">
              {status === "saving" && <Spinner />}
              {status === "saved" && <CheckIcon />}
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
