import { ChevronDown, ChevronRight, Loader2, Pencil, Trash2 } from "lucide-preact";
import type { AccountDto, BucketDto } from "../../../shared/api-contracts/dto";
import { AccountTypeSection } from "./AccountTypeSection";
import { InlineTextEditor } from "./InlineTextEditor";

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
            <div class="flex-1">
              <InlineTextEditor
                value={editedName}
                onChange={onEditNameChange}
                onSave={onSaveName}
                onCancel={onCancelEdit}
                saving={savingName}
              />
            </div>
          ) : (
            <>
              <div class="flex-1 flex items-center gap-2">
                <span class="font-medium text-neutral-900 dark:text-neutral-100">
                  {bucket.name}
                </span>
                <span class="text-xs text-neutral-500 dark:text-neutral-400">
                  {assetCount > 0 && `${assetCount} ${assetCount === 1 ? "asset" : "assets"}`}
                  {assetCount > 0 && debtCount > 0 && ", "}
                  {debtCount > 0 && `${debtCount} ${debtCount === 1 ? "debt" : "debts"}`}
                  {assetCount === 0 && debtCount === 0 && "empty"}
                </span>
                {savingAccounts && (
                  <Loader2 size={14} class="animate-spin text-neutral-400" />
                )}
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
            <p class="text-sm text-neutral-500 dark:text-neutral-400">
              No accounts available
            </p>
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
