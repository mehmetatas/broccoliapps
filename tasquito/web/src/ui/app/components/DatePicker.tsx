import { Calendar, X } from "lucide-preact";
import { useRef } from "preact/hooks";

type DatePickerProps = {
  value?: string; // YYYY-MM-DD
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
};

export const DatePicker = ({
  value,
  onChange,
  placeholder = "YYYY-MM-DD",
  disabled = false,
}: DatePickerProps) => {
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  const handleTextChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const dateValue = input.value.trim();
    // Only update if it's a valid YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      onChange(dateValue);
    }
  };

  const handleCalendarClick = () => {
    hiddenInputRef.current?.showPicker();
  };

  const handleDateInputChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (input.value) {
      onChange(input.value);
    }
  };

  const handleClear = () => {
    onChange(undefined);
  };

  return (
    <div class="inline-flex items-center gap-1">
      {/* Input with calendar icon inside */}
      <div class="relative inline-flex items-center">
        <input
          type="text"
          value={value ?? ""}
          placeholder={placeholder}
          onBlur={handleTextChange}
          disabled={disabled}
          class="w-36 pl-2 pr-8 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg
                 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100
                 focus:outline-none focus:border-blue-400 dark:focus:border-blue-500
                 disabled:bg-neutral-100 dark:disabled:bg-neutral-700 disabled:opacity-50"
        />
        <button
          type="button"
          onClick={handleCalendarClick}
          disabled={disabled}
          class="absolute right-2 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Calendar size={16} />
        </button>
      </div>

      {/* Hidden native date picker */}
      <input
        ref={hiddenInputRef}
        type="date"
        value={value ?? ""}
        onChange={handleDateInputChange}
        class="sr-only"
        tabIndex={-1}
      />

      {/* Clear button */}
      {value && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          class="p-1 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};
