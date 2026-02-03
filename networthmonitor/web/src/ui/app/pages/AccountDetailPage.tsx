import { Modal, preferences } from "@broccoliapps/browser";
import { Trash2 } from "lucide-preact";
import { useMemo, useState } from "preact/hooks";
import { AccountDetailSkeleton, AccountHeader, BucketPicker, HistoryEditor, MoneyDisplay, PageHeader, RemoveAccountModal, ValueChart } from "../components";
import { useAccountDetail, useExchangeRates } from "../hooks";
import { convertValue, getEarliestMonth } from "../utils/currencyConversion";

type AccountDetailPageProps = {
  id?: string;
};

export const AccountDetailPage = ({ id }: AccountDetailPageProps) => {
  const detail = useAccountDetail(id);

  // Currency toggle state
  const [showConverted, setShowConverted] = useState(false);
  const targetCurrency = (preferences.getAllSync()?.targetCurrency as string) || "USD";

  // Get earliest month for exchange rates
  const earliestMonth = useMemo(() => {
    return getEarliestMonth({ account: detail.originalHistory });
  }, [detail.originalHistory]);

  // Fetch exchange rates if account currency differs from target
  const currenciesToFetch = detail.account?.currency && detail.account.currency !== targetCurrency ? [detail.account.currency] : [];
  const { rates: exchangeRates } = useExchangeRates(currenciesToFetch, targetCurrency, earliestMonth);

  // Convert history values when showing converted currency
  const displayHistory = useMemo(() => {
    if (!showConverted || !exchangeRates || !detail.account) {
      return detail.editedHistory;
    }
    const converted: Record<string, number | undefined> = {};
    for (const [month, value] of Object.entries(detail.editedHistory)) {
      if (value !== undefined) {
        converted[month] = convertValue(value, detail.account.currency, month, exchangeRates, targetCurrency);
      }
    }
    return converted;
  }, [detail.editedHistory, showConverted, exchangeRates, detail.account, targetCurrency]);

  if (detail.isLoading) {
    return <AccountDetailSkeleton />;
  }

  if (detail.error || !detail.account) {
    return (
      <div>
        <PageHeader title="Error" backHref="/" />
        <p class="text-red-600 dark:text-red-400">{detail.error || "Not found"}</p>
      </div>
    );
  }

  const { account } = detail;
  const latestMonth = Object.entries(detail.editedHistory)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => b.localeCompare(a))[0];
  const latestValue = latestMonth?.[1] ?? 0;
  const isArchived = !!account.archivedAt;

  return (
    <div>
      <AccountHeader
        account={account}
        isEditing={detail.editingName}
        editedName={detail.editedName}
        saving={detail.savingName}
        onStartEdit={detail.handleStartEditName}
        onCancelEdit={detail.handleCancelEditName}
        onSave={detail.handleSaveName}
        onNameChange={detail.setEditedName}
      />

      <div class="space-y-6">
        <div>
          <div class="mb-4">
            <MoneyDisplay
              amount={latestValue}
              currency={account.currency}
              convert={showConverted}
              size="xl"
              toggler={true}
              onToggle={() => setShowConverted(!showConverted)}
            />
          </div>

          {isArchived && (
            <div class="mb-4 px-4 py-3 bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center justify-between">
              <p class="text-sm text-amber-800 dark:text-amber-200">Archived on {new Date(account.archivedAt!).toLocaleDateString()}</p>
              <button
                onClick={detail.handleUnarchive}
                disabled={detail.unarchiving}
                class="text-sm text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200 font-medium hover:underline disabled:opacity-50"
              >
                {detail.unarchiving ? "..." : "Unarchive"}
              </button>
            </div>
          )}

          <div class="mb-4">
            <ValueChart
              data={displayHistory}
              variant={account.type === "debt" ? "negative" : "default"}
              currency={showConverted ? targetCurrency : account.currency}
            />
          </div>

          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Value History</h2>
          </div>

          <HistoryEditor
            history={detail.editedHistory}
            onChange={detail.handleHistoryChange}
            onBlur={detail.handleBlur}
            currency={account.currency}
            savingMonths={detail.savingMonths}
            savedMonths={detail.savedMonths}
            disabled={isArchived}
            updateFrequency={account.updateFrequency}
          />
        </div>

        <BucketPicker
          selectedBucketIds={detail.accountBucketIds}
          onChange={detail.handleBucketsChange}
          preloadedBuckets={detail.allBuckets}
          onBucketsChange={detail.setAllBuckets}
        />

        <div class="pt-12 text-center">
          {isArchived ? (
            <button
              onClick={() => detail.deleteModal.open()}
              class="inline-flex items-center gap-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm hover:underline"
            >
              <Trash2 size={16} />
              Permanently Delete
            </button>
          ) : (
            <button
              onClick={() => detail.removeModal.open()}
              class="inline-flex items-center gap-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm hover:underline"
            >
              <Trash2 size={16} />
              Remove {account.type === "asset" ? "Asset" : "Debt"}
            </button>
          )}
        </div>
      </div>

      {/* Remove Modal (Archive or Delete) - for non-archived accounts */}
      <RemoveAccountModal
        open={detail.removeModal.isOpen}
        onClose={detail.removeModal.close}
        onArchive={detail.handleArchive}
        onDelete={detail.handleDelete}
        accountType={account.type}
        isLoading={detail.removing}
      />

      {/* Permanent Delete Modal - for archived accounts */}
      <Modal
        isOpen={detail.deleteModal.isOpen}
        onClose={detail.deleteModal.close}
        onConfirm={detail.handlePermanentDelete}
        title="Permanently Delete"
        confirmText="Delete"
        confirmVariant="danger"
        isLoading={detail.deleting}
      >
        <p class="mb-4">This will permanently erase all records of this {account.type === "asset" ? "asset" : "debt"}, as if it never existed.</p>
        <p>Are you sure? This action cannot be undone.</p>
      </Modal>
    </div>
  );
};
