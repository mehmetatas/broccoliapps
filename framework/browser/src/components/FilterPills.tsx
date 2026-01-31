import type { ComponentChildren } from "preact";
import { useCallback, useRef } from "preact/hooks";

type FilterOption<T extends string> = {
  value: T;
  label: string;
  icon?: ComponentChildren;
};

type FilterPillsProps<T extends string> = {
  options: FilterOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
};

export const FilterPills = <T extends string>({
  options,
  selected,
  onSelect,
}: FilterPillsProps<T>) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSelect = useCallback((value: T, el: HTMLButtonElement) => {
    onSelect(value);
    // Scroll the selected pill to center
    const container = containerRef.current;
    if (!container) return;
    const scrollLeft = el.offsetLeft - container.clientWidth / 2 + el.offsetWidth / 2;
    container.scrollTo({ left: scrollLeft, behavior: "smooth" });
  }, [onSelect]);

  return (
    <div
      ref={containerRef}
      class="flex gap-2 overflow-x-auto scrollbar-hide"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={(e) => handleSelect(option.value, e.currentTarget as HTMLButtonElement)}
          class={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all active:scale-95 flex-shrink-0 ${
            selected === option.value
              ? "bg-emerald-600 text-white shadow-sm"
              : "bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-600"
          }`}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );
};
