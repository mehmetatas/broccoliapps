import { Skeleton } from "@broccoliapps/browser";

export const ProjectCardSkeleton = () => {
  return (
    <div class="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 space-y-3">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  );
};

export const ProjectGridSkeleton = ({ count = 6 }: { count?: number }) => {
  return (
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) =>
        <ProjectCardSkeleton key={i} />
      )}
    </div>
  );
};

export const TaskCardSkeleton = () => {
  return (
    <div class="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 space-y-3">
      <div class="flex items-start gap-3">
        <Skeleton className="h-5 w-5 rounded flex-shrink-0 mt-0.5" />
        <div class="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    </div>
  );
};

export const ProjectDetailSkeleton = () => {
  return (
    <div class="space-y-6">
      {/* Header */}
      <div class="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <Skeleton className="h-8 flex-1 max-w-md" />
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>

      {/* Task Form */}
      <Skeleton className="h-12 w-full rounded-xl" />

      {/* Tasks */}
      <div class="space-y-4">
        <TaskCardSkeleton />
        <TaskCardSkeleton />
        <TaskCardSkeleton />
      </div>
    </div>
  );
};
