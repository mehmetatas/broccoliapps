import { ArrowLeft, Check, CreditCard, Loader2, Pencil, TrendingUp, X } from "lucide-preact";
import type { AccountDto } from "../../../shared/api-contracts/dto";
import { AppLink } from "../SpaApp";

type AccountHeaderProps = {
  account: AccountDto;
  isEditing: boolean;
  editedName: string;
  saving: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onNameChange: (name: string) => void;
};

export const AccountHeader = ({
  account,
  isEditing,
  editedName,
  saving,
  onStartEdit,
  onCancelEdit,
  onSave,
  onNameChange,
}: AccountHeaderProps) => {
  return (
    <div class="flex items-center gap-3 mb-6">
      <AppLink
        href="/"
        class="p-2 rounded-lg text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
      >
        <ArrowLeft size={20} />
      </AppLink>
      <div
        class={`p-2 rounded-lg ${
          account.type === "asset"
            ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400"
            : "bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400"
        }`}
      >
        {account.type === "asset" ? <TrendingUp size={24} /> : <CreditCard size={24} />}
      </div>
      <div class="flex-1">
        {isEditing ? (
          <div class="flex items-center gap-2">
            <input
              type="text"
              value={editedName}
              onInput={(e) => onNameChange((e.target as HTMLInputElement).value)}
              class="flex-1 text-2xl font-bold bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-1 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {onSave();}
                if (e.key === "Escape") {onCancelEdit();}
              }}
            />
            {saving ? (
              <span class="p-2 text-neutral-500">
                <Loader2 size={20} class="animate-spin" />
              </span>
            ) : (
              <>
                <button
                  onClick={onSave}
                  class="p-2 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                >
                  <Check size={20} />
                </button>
                <button
                  onClick={onCancelEdit}
                  class="p-2 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </>
            )}
          </div>
        ) : (
          <div class="flex items-center gap-2">
            <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {account.name}
            </h1>
            <button
              onClick={onStartEdit}
              class="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
            >
              <Pencil size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
