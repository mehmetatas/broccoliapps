import { Check, Loader2, X } from "lucide-preact";
import type { JSX } from "preact";

type InlineTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  saving?: boolean;
  placeholder?: string;
  inputClassName?: string;
  autoFocus?: boolean;
};

export const InlineTextEditor = ({
  value,
  onChange,
  onSave,
  onCancel,
  saving = false,
  placeholder,
  inputClassName = "",
  autoFocus = true,
}: InlineTextEditorProps) => {
  const handleKeyDown = (e: JSX.TargetedKeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSave();
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <div class="flex items-center gap-2">
      <input
        type="text"
        value={value}
        onInput={(e) => onChange((e.target as HTMLInputElement).value)}
        class={`flex-1 px-3 py-1.5 text-sm bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${inputClassName}`}
        autoFocus={autoFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
      />
      {saving ? (
        <span class="p-1.5 text-neutral-500">
          <Loader2 size={18} class="animate-spin" />
        </span>
      ) : (
        <>
          <button
            onClick={onSave}
            class="p-1.5 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors"
          >
            <Check size={18} />
          </button>
          <button
            onClick={onCancel}
            class="p-1.5 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors"
          >
            <X size={18} />
          </button>
        </>
      )}
    </div>
  );
};
