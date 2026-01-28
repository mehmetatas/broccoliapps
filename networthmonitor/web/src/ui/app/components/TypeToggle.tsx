type TypeToggleProps = {
  value: "asset" | "debt";
  onChange: (value: "asset" | "debt") => void;
};

export const TypeToggle = ({ value, onChange }: TypeToggleProps) => {
  return (
    <div class="flex flex-col gap-1.5">
      <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300">
        Type
      </label>
      <div class="flex">
        <button
          type="button"
          onClick={() => onChange("asset")}
          class={`flex-1 h-10 px-4 font-medium transition-colors border border-r-0 border-neutral-200 dark:border-neutral-700 rounded-l-lg ${value === "asset"
              ? "bg-indigo-600 dark:bg-indigo-500 text-white border-indigo-600 dark:border-indigo-500"
              : "bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700"
            }`}
        >
          Asset
        </button>
        <button
          type="button"
          onClick={() => onChange("debt")}
          class={`flex-1 h-10 px-4 font-medium transition-colors border border-neutral-200 dark:border-neutral-700 rounded-r-lg ${value === "debt"
              ? "bg-red-600 dark:bg-red-500 text-white border-red-600 dark:border-red-500"
              : "bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700"
            }`}
        >
          Debt
        </button>
      </div>
    </div>
  );
};
