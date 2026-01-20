import { useEffect, useRef, useState } from "preact/hooks";
import type { UpdateFrequency } from "../../../db/accounts";

type FrequencyPickerProps = {
  value: UpdateFrequency;
  onChange: (value: UpdateFrequency) => void;
};

const FREQUENCY_OPTIONS: { value: UpdateFrequency; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Every 3 months" },
  { value: "biannually", label: "Every 6 months" },
  { value: "yearly", label: "Yearly" },
];

export const FrequencyPicker = ({ value, onChange }: FrequencyPickerProps) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = FREQUENCY_OPTIONS.find((opt) => opt.value === value)?.label || "Monthly";

  const handleSelect = (frequency: UpdateFrequency) => {
    onChange(frequency);
    setOpen(false);
  };

  return (
    <div ref={containerRef} class="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        class="w-full h-10 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-colors"
      >
        <span class="text-neutral-900 dark:text-neutral-100">{selectedLabel}</span>
        <svg class="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div class="absolute z-50 mt-1 w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg">
          <ul class="py-1">
            {FREQUENCY_OPTIONS.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  class={`w-full px-4 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 ${
                    value === option.value
                      ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium"
                      : "text-neutral-700 dark:text-neutral-300"
                  }`}
                >
                  {option.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
