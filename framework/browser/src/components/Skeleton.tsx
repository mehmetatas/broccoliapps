type SkeletonProps = {
  className?: string;
};

export const Skeleton = ({ className = "" }: SkeletonProps) => {
  return <div class={`animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded ${className}`} />;
};
