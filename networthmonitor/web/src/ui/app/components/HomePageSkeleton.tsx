export const HomePageSkeleton = () => {
  return (
    <div class="animate-pulse">
      {/* Bucket Pills Skeleton */}
      <div class="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 mb-6">
        <div class="flex gap-2 p-3">
          <div class="h-8 w-24 bg-neutral-200 dark:bg-neutral-700 rounded-full" />
          <div class="h-8 w-20 bg-neutral-200 dark:bg-neutral-700 rounded-full" />
          <div class="h-8 w-28 bg-neutral-200 dark:bg-neutral-700 rounded-full" />
        </div>
      </div>

      {/* Net Worth Value Skeleton */}
      <div class="mb-4">
        <div class="h-10 w-48 bg-neutral-200 dark:bg-neutral-700 rounded" />
      </div>

      {/* Chart Skeleton */}
      <div class="h-48 bg-neutral-200 dark:bg-neutral-700 rounded-lg mb-6" />

      {/* Assets and Debts Grid Skeleton */}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Assets Skeleton */}
        <div>
          <div class="h-6 w-16 bg-neutral-200 dark:bg-neutral-700 rounded mb-3" />
          <div class="space-y-3">
            <div class="h-16 bg-neutral-200 dark:bg-neutral-700 rounded-lg" />
            <div class="h-16 bg-neutral-200 dark:bg-neutral-700 rounded-lg" />
          </div>
        </div>
        {/* Debts Skeleton */}
        <div>
          <div class="h-6 w-14 bg-neutral-200 dark:bg-neutral-700 rounded mb-3" />
          <div class="space-y-3">
            <div class="h-16 bg-neutral-200 dark:bg-neutral-700 rounded-lg" />
            <div class="h-16 bg-neutral-200 dark:bg-neutral-700 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
};
