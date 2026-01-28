type NoDataPlaceholderProps = {
  message?: string;
};

export const NoDataPlaceholder = ({ message = "No data" }: NoDataPlaceholderProps) => {
  return (
    <div class="h-64 mb-6 bg-white dark:bg-black rounded-lg p-3 flex items-center justify-center relative overflow-hidden">
      <svg
        class="absolute inset-0 w-full h-full opacity-[0.07] dark:opacity-[0.1]"
        viewBox="0 0 400 200"
        preserveAspectRatio="none"
      >
        <path
          d="M0,150 Q50,140 80,120 T160,100 T240,80 T320,90 T400,60"
          fill="none"
          stroke="currentColor"
          stroke-width="3"
          class="text-neutral-400"
        />
        <path
          d="M0,150 Q50,140 80,120 T160,100 T240,80 T320,90 T400,60 L400,200 L0,200 Z"
          fill="currentColor"
          class="text-neutral-400"
        />
      </svg>
      <span class="text-4xl font-bold text-neutral-200 dark:text-neutral-700 select-none relative z-10">
        {message}
      </span>
    </div>
  );
};
