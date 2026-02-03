import type { AccountDto, BucketDto } from "@broccoliapps/nwm-shared";
import { Check, ChevronDown, ChevronRight, Loader2, Pencil, Trash2, X } from "lucide-preact";
import type { TargetedKeyboardEvent } from "preact";
import { AccountTypeSection } from "./AccountTypeSection";

type BucketListItemProps = {
  bucket: BucketDto;
  accounts: AccountDto[];
  bucketAccountIds: string[];
  isExpanded: boolean;
  isEditing: boolean;
  editedName: string;
  savingName: boolean;
  savingAccounts: boolean;
  onToggleExpanded: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveName: () => void;
  onEditNameChange: (name: string) => void;
  onDelete: () => void;
  onToggleAccount: (accountId: string) => void;
};

export const BucketListItem = ({
  bucket,
  accounts,
  bucketAccountIds,
  isExpanded,
  isEditing,
  editedName,
  savingName,
  savingAccounts,
  onToggleExpanded,
  onStartEdit,
  onCancelEdit,
  onSaveName,
  onEditNameChange,
  onDelete,
  onToggleAccount,
}: BucketListItemProps) => {
  const bucketAccounts = accounts.filter((a) => bucketAccountIds.includes(a.id));
  const assetCount = bucketAccounts.filter((a) => a.type === "asset").length;
  const debtCount = bucketAccounts.filter((a) => a.type === "debt").length;
  const openAccounts = accounts.filter((a) => !a.archivedAt);

  return (
    <div class="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
      <div class="p-4">
        <div class="flex items-center gap-3">
          <button
            onClick={onToggleExpanded}
            class="p-1 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors"
          >
            {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </button>

          {isEditing ? (
            <div class="flex-1 flex items-center gap-2">
              <input
                type="text"
                value={editedName}
                onInput={(e) => onEditNameChange((e.target as HTMLInputElement).value)}
                class="flex-1 px-3 py-1.5 text-sm bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                autoFocus
                onKeyDown={(e: TargetedKeyboardEvent<HTMLInputElement>) => {
                  if (e.key === "Enter") {
                    onSaveName();
                  } else if (e.key === "Escape") {
                    onCancelEdit();
                  }
                }}
              />
              {savingName ? (
                <span class="p-1.5 text-neutral-500">
                  <Loader2 size={18} class="animate-spin" />
                </span>
              ) : (
                <>
                  <button
                    onClick={onSaveName}
                    class="p-1.5 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors"
                  >
                    <Check size={18} />
                  </button>
                  <button
                    onClick={onCancelEdit}
                    class="p-1.5 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors"
                  >
                    <X size={18} />
                  </button>
                </>
              )}
            </div>
          ) : (
            <>
              <div class="flex-1 flex items-center gap-2">
                <span class="font-medium text-neutral-900 dark:text-neutral-100">{bucket.name}</span>
                <span class="text-xs text-neutral-500 dark:text-neutral-400">
                  {assetCount > 0 && `${assetCount} ${assetCount === 1 ? "asset" : "assets"}`}
                  {assetCount > 0 && debtCount > 0 && ", "}
                  {debtCount > 0 && `${debtCount} ${debtCount === 1 ? "debt" : "debts"}`}
                  {assetCount === 0 && debtCount === 0 && "empty"}
                </span>
                {savingAccounts && <Loader2 size={14} class="animate-spin text-neutral-400" />}
              </div>
              <button
                onClick={onStartEdit}
                class="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={onDelete}
                class="p-1.5 text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {isExpanded && (
        <div class="border-t border-neutral-200 dark:border-neutral-700 px-4 py-3">
          {openAccounts.length === 0 ? (
            <p class="text-sm text-neutral-500 dark:text-neutral-400">No accounts available</p>
          ) : (
            <div class="space-y-4">
              <AccountTypeSection
                title="Assets"
                accounts={openAccounts.filter((a) => a.type === "asset")}
                selectedAccountIds={bucketAccountIds}
                onToggleAccount={onToggleAccount}
                selectedColor="bg-teal-600 dark:bg-teal-600"
              />
              <AccountTypeSection
                title="Debts"
                accounts={openAccounts.filter((a) => a.type === "debt")}
                selectedAccountIds={bucketAccountIds}
                onToggleAccount={onToggleAccount}
                selectedColor="bg-red-600 dark:bg-red-500"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
