import { DropdownButton, useClickOutside } from "@broccoliapps/browser";
import { useCallback, useRef, useState } from "preact/hooks";
import type { UpdateFrequency } from "@broccoliapps/nwm-shared";

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

  const closeDropdown = useCallback(() => setOpen(false), []);
  useClickOutside(containerRef, closeDropdown, open);

  const selectedLabel = FREQUENCY_OPTIONS.find((opt) => opt.value === value)?.label || "Monthly";

  const handleSelect = (frequency: UpdateFrequency) => {
    onChange(frequency);
    setOpen(false);
  };

  return (
    <div ref={containerRef} class="relative">
      <DropdownButton onClick={() => setOpen(!open)} value={selectedLabel} />

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
