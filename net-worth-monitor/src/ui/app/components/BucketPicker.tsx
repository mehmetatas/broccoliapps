import { Check, Loader2, Plus } from "lucide-preact";
import { useEffect, useState } from "preact/hooks";
import type { Bucket } from "../../../db/buckets";
import { getBuckets, postBucket } from "../../../shared/api-contracts";
import { AppLink } from "../SpaApp";

type BucketPickerProps = {
  selectedBucketIds: Set<string>;
  onChange: (bucketIds: Set<string>) => void;
  showHeader?: boolean;
  showManageLink?: boolean;
};

export const BucketPicker = ({
  selectedBucketIds,
  onChange,
  showHeader = true,
  showManageLink = true,
}: BucketPickerProps) => {
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [newBucketName, setNewBucketName] = useState("");
  const [creatingBucket, setCreatingBucket] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchBuckets = async () => {
      try {
        const result = await getBuckets.invoke();
        setBuckets(result);
      } catch (err) {
        console.error("Failed to load buckets:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBuckets();
  }, []);

  const handleToggleBucket = (bucketId: string) => {
    const newBucketIds = new Set(selectedBucketIds);
    if (newBucketIds.has(bucketId)) {
      newBucketIds.delete(bucketId);
    } else {
      newBucketIds.add(bucketId);
    }
    onChange(newBucketIds);
  };

  const handleCreateBucket = async () => {
    if (!newBucketName.trim()) return;

    setCreatingBucket(true);
    try {
      const bucket = await postBucket.invoke({ name: newBucketName.trim() });
      setBuckets((prev) => [...prev, bucket]);
      // Automatically select the new bucket
      const newBucketIds = new Set(selectedBucketIds);
      newBucketIds.add(bucket.id);
      onChange(newBucketIds);
      setNewBucketName("");
    } catch (err) {
      console.error("Failed to create bucket:", err);
    } finally {
      setCreatingBucket(false);
    }
  };

  if (loading) {
    return (
      <div class="flex items-center justify-center py-4">
        <Loader2 size={20} class="animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div>
      {showHeader && (
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Buckets
            </h2>
            {(saving || creatingBucket) && (
              <Loader2 size={16} class="animate-spin text-neutral-400" />
            )}
          </div>
          {showManageLink && (
            <AppLink
              href="/buckets"
              class="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline"
            >
              Manage
            </AppLink>
          )}
        </div>
      )}
      <div class="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
        <div class="flex flex-wrap gap-2 pb-3">
          {[...buckets]
            .sort((a, b) => {
              const aSelected = selectedBucketIds.has(a.id);
              const bSelected = selectedBucketIds.has(b.id);
              if (aSelected !== bSelected) return bSelected ? 1 : -1;
              return a.name.localeCompare(b.name);
            })
            .map((bucket) => {
              const isSelected = selectedBucketIds.has(bucket.id);
              return (
                <button
                  key={bucket.id}
                  type="button"
                  onClick={() => handleToggleBucket(bucket.id)}
                  class={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all active:scale-95 ${
                    isSelected
                      ? "bg-indigo-600 dark:bg-indigo-500 text-white shadow-sm"
                      : "bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600"
                  }`}
                >
                  {isSelected && <Check size={14} class="shrink-0" />}
                  {bucket.name}
                </button>
              );
            })}
          {buckets.length === 0 && (
            <p class="text-sm text-neutral-500 dark:text-neutral-400">
              No buckets yet
            </p>
          )}
        </div>
        <div class="flex items-center gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-700">
          <input
            type="text"
            value={newBucketName}
            onInput={(e) => setNewBucketName((e.target as HTMLInputElement).value)}
            placeholder="Create new bucket..."
            class="flex-1 px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-700/50 border border-neutral-200 dark:border-neutral-600 rounded-full text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-neutral-700"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateBucket();
            }}
          />
          <button
            type="button"
            onClick={handleCreateBucket}
            disabled={!newBucketName.trim() || creatingBucket}
            class="p-2 text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed rounded-full transition-colors active:scale-95"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
