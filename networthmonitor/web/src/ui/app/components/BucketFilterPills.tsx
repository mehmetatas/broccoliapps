import { Check } from "lucide-preact";
import { useCallback, useRef } from "preact/hooks";
import type { BucketDto } from "../../../shared/api-contracts/dto";

type BucketFilterPillsProps = {
  buckets: BucketDto[];
  selectedBucketId: string | null;
  onSelect: (bucketId: string | null) => void;
};

export const BucketFilterPills = ({
  buckets,
  selectedBucketId,
  onSelect,
}: BucketFilterPillsProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToCenter = useCallback((element: HTMLButtonElement) => {
    element.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, []);

  // Sort buckets alphabetically
  const sortedBuckets = [...buckets].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div class="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 mb-6">
      <div
        ref={scrollRef}
        class="flex gap-2 p-3 overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <button
          type="button"
          onClick={(e) => {
            onSelect(null);
            scrollToCenter(e.currentTarget);
          }}
          class={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all active:scale-95 shrink-0 ${
            selectedBucketId === null
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-neutral-200 dark:bg-neutral-600 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-500"
          }`}
        >
          {selectedBucketId === null && <Check size={14} class="shrink-0" />}
          Net Worth
        </button>
        {sortedBuckets.map((bucket) => (
          <button
            key={bucket.id}
            type="button"
            onClick={(e) => {
              onSelect(bucket.id);
              scrollToCenter(e.currentTarget);
            }}
            class={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all active:scale-95 shrink-0 ${
              selectedBucketId === bucket.id
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-neutral-200 dark:bg-neutral-600 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-500"
            }`}
          >
            {selectedBucketId === bucket.id && <Check size={14} class="shrink-0" />}
            {bucket.name}
          </button>
        ))}
      </div>
    </div>
  );
};
