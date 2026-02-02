import { Button } from "@broccoliapps/browser";
import { Loader2, Plus } from "lucide-preact";

type AddBucketFormProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading?: boolean;
};

export const AddBucketForm = ({
  value,
  onChange,
  onSubmit,
  isLoading = false,
}: AddBucketFormProps) => {
  return (
    <div class="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
      <div class="flex items-center gap-3">
        <input
          type="text"
          value={value}
          onInput={(e) => onChange((e.target as HTMLInputElement).value)}
          placeholder="New bucket name"
          class="flex-1 px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onSubmit();
            }
          }}
        />
        <Button onClick={onSubmit} disabled={!value.trim() || isLoading}>
          {isLoading ?
            <Loader2 size={18} class="animate-spin" />
            :
            <Plus size={18} />
          }
        </Button>
      </div>
    </div>
  );
};
