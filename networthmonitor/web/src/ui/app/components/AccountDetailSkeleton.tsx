export const AccountDetailSkeleton = () => {
  return (
    <div class="animate-pulse">
      {/* Header Skeleton */}
      <div class="flex items-center gap-3 mb-6">
        <div class="w-9 h-9 bg-neutral-200 dark:bg-neutral-700 rounded-lg" />
        <div class="w-10 h-10 bg-neutral-200 dark:bg-neutral-700 rounded-lg" />
        <div class="h-8 w-48 bg-neutral-200 dark:bg-neutral-700 rounded" />
      </div>

      <div class="space-y-6">
        {/* Value Skeleton */}
        <div class="mb-4">
          <div class="h-10 w-36 bg-neutral-200 dark:bg-neutral-700 rounded" />
        </div>

        {/* Chart Skeleton */}
        <div class="h-48 bg-neutral-200 dark:bg-neutral-700 rounded-lg" />

        {/* Value History Header Skeleton */}
        <div class="flex items-center justify-between mb-4">
          <div class="h-6 w-28 bg-neutral-200 dark:bg-neutral-700 rounded" />
          <div class="h-5 w-16 bg-neutral-200 dark:bg-neutral-700 rounded" />
        </div>

        {/* History Editor Skeleton */}
        <div class="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 space-y-3">
          <div class="h-10 bg-neutral-200 dark:bg-neutral-700 rounded-lg" />
          <div class="h-10 bg-neutral-200 dark:bg-neutral-700 rounded-lg" />
          <div class="h-10 bg-neutral-200 dark:bg-neutral-700 rounded-lg" />
          <div class="h-10 bg-neutral-200 dark:bg-neutral-700 rounded-lg" />
        </div>

        {/* Bucket Picker Skeleton */}
        <div>
          <div class="h-5 w-20 bg-neutral-200 dark:bg-neutral-700 rounded mb-2" />
          <div class="flex gap-2">
            <div class="h-8 w-24 bg-neutral-200 dark:bg-neutral-700 rounded-full" />
            <div class="h-8 w-20 bg-neutral-200 dark:bg-neutral-700 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
