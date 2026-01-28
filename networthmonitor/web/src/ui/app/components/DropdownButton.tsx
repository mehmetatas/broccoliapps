type DropdownButtonProps = {
  onClick: () => void;
  disabled?: boolean;
  placeholder?: string;
  value?: string;
  loading?: boolean;
  loadingText?: string;
  className?: string;
};

export const DropdownButton = ({
  onClick,
  disabled = false,
  placeholder = "Select...",
  value,
  loading = false,
  loadingText = "Loading...",
  className = "",
}: DropdownButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      class={`w-full h-10 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-colors disabled:opacity-50 ${className}`}
    >
      <span class={value ? "text-neutral-900 dark:text-neutral-100" : "text-neutral-400 dark:text-neutral-500"}>
        {loading ? loadingText : value || placeholder}
      </span>
      <svg class="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
};
