import { Modal, preferences, useModal } from "@broccoliapps/browser";
import { Trash2 } from "lucide-preact";
import { route } from "preact-router";
import { useEffect, useMemo, useState } from "preact/hooks";
import type { AccountDto, BucketDto } from "../../../shared/api-contracts/dto";
import {
  deleteAccount,
  deleteHistoryItem,
  getAccountDetail,
  patchAccount,
  postHistoryItem,
  putAccountBuckets,
} from "../api";
import {
  AccountDetailSkeleton,
  AccountHeader,
  BucketPicker,
  HistoryEditor,
  MoneyDisplay,
  PageHeader,
  RemoveAccountModal,
  ValueChart,
} from "../components";
import { useExchangeRates } from "../hooks";
import { convertValue, getEarliestMonth } from "../utils/currencyConversion";

type AccountDetailPageProps = {
  id?: string;
};

export const AccountDetailPage = ({ id }: AccountDetailPageProps) => {
  const [account, setAccount] = useState<AccountDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editedHistory, setEditedHistory] = useState<Record<string, number | undefined>>({});
  const [originalHistory, setOriginalHistory] = useState<Record<string, number>>({});
  const [savingMonths, setSavingMonths] = useState<Record<string, boolean>>({});
  const [savedMonths, setSavedMonths] = useState<Record<string, boolean>>({});

  // Name editing
  const [editingName, setEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [savingName, setSavingName] = useState(false);

  // Bucket picker
  const [accountBucketIds, setAccountBucketIds] = useState<Set<string>>(new Set());
  const [allBuckets, setAllBuckets] = useState<BucketDto[]>([]);

  // Remove modal (archive or delete) - for non-archived accounts
  const removeModal = useModal();
  const [removing, setRemoving] = useState(false);

  // Delete modal - for archived accounts (permanent delete only)
  const deleteModal = useModal();
  const [deleting, setDeleting] = useState(false);

  const [unarchiving, setUnarchiving] = useState(false);

  // Currency toggle state
  const [showConverted, setShowConverted] = useState(false);
  const targetCurrency = (preferences.getAllSync()?.targetCurrency as string) || "USD";

  // Get earliest month for exchange rates
  const earliestMonth = useMemo(() => {
    return getEarliestMonth({ account: originalHistory });
  }, [originalHistory]);

  // Fetch exchange rates if account currency differs from target
  const currenciesToFetch = account?.currency && account.currency !== targetCurrency
    ? [account.currency]
    : [];
  const { rates: exchangeRates } = useExchangeRates(
    currenciesToFetch,
    targetCurrency,
    earliestMonth
  );

  // Convert history values when showing converted currency
  const displayHistory = useMemo(() => {
    if (!showConverted || !exchangeRates || !account) {
      return editedHistory;
    }
    const converted: Record<string, number | undefined> = {};
    for (const [month, value] of Object.entries(editedHistory)) {
      if (value !== undefined) {
        converted[month] = convertValue(value, account.currency, month, exchangeRates, targetCurrency);
      }
    }
    return converted;
  }, [editedHistory, showConverted, exchangeRates, account, targetCurrency]);

  // Helper: Update history state from API response
  const updateHistoryFromResponse = (
    history: Record<string, number>,
    alsoUpdateEdited = false
  ) => {
    setOriginalHistory(history);
    if (alsoUpdateEdited) {
      setEditedHistory({ ...history });
    }
  };

  // Helper: Show save success indicator for a month
  const showSaveSuccess = (month: string) => {
    setSavingMonths((prev) => ({ ...prev, [month]: false }));
    setSavedMonths((prev) => ({ ...prev, [month]: true }));
    setTimeout(() => {
      setSavedMonths((prev) => ({ ...prev, [month]: false }));
    }, 1000);
  };

  // Helper: Save a single history item to server
  const saveHistoryItem = async (month: string, value: number) => {
    if (!account) { return; }

    setSavingMonths((prev) => ({ ...prev, [month]: true }));

    try {
      await postHistoryItem({ id: account.id, month, value });
      // Update local state with the new value
      setOriginalHistory((prev) => ({ ...prev, [month]: value }));
      showSaveSuccess(month);
    } catch (err) {
      setSavingMonths((prev) => ({ ...prev, [month]: false }));
      throw err;
    }
  };

  // Helper: Delete a single history item from server
  const deleteHistoryItemFromServer = async (month: string) => {
    if (!account) { return; }

    setSavingMonths((prev) => ({ ...prev, [month]: true }));

    try {
      await deleteHistoryItem({ id: account.id, month });
      // Remove from local state
      setOriginalHistory((prev) => {
        const newHistory = { ...prev };
        delete newHistory[month];
        return newHistory;
      });
      showSaveSuccess(month);
    } catch (err) {
      setSavingMonths((prev) => ({ ...prev, [month]: false }));
      throw err;
    }
  };

  useEffect(() => {
    if (!id) { return; }

    const fetchData = async () => {
      try {
        const result = await getAccountDetail(id);
        setAccount(result.account);
        setAccountBucketIds(new Set(result.accountBuckets.map((b) => b.id)));
        setAllBuckets(result.allBuckets);

        // Use embedded history map from account
        const historyMap = result.account.history ?? {};
        setOriginalHistory(historyMap);
        setEditedHistory({ ...historyMap });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleHistoryChange = async (month: string, value: number | undefined) => {
    const previousValue = editedHistory[month];
    setEditedHistory((prev) => ({ ...prev, [month]: value }));

    // If deleting an entry that existed in the database, save immediately
    // (can't rely on blur event since the input is removed from DOM)
    if (value === undefined && originalHistory[month] !== undefined) {
      try {
        await deleteHistoryItemFromServer(month);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete entry");
        // Revert the deletion on error
        setEditedHistory((prev) => ({ ...prev, [month]: previousValue }));
      }
    }
  };

  const handleBlur = async (month: string) => {
    if (!account) { return; }

    const currentValue = editedHistory[month];
    const originalValue = originalHistory[month];

    // Check if value changed
    if (currentValue === originalValue) { return; }
    if (currentValue === undefined && originalValue === undefined) { return; }
    // Skip if value is undefined (deletion is handled in handleHistoryChange)
    if (currentValue === undefined) { return; }

    try {
      await saveHistoryItem(month, currentValue);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes");
    }
  };

  const handleArchive = async () => {
    if (!account) { return; }

    setRemoving(true);
    try {
      const { account: updated } = await patchAccount({ id: account.id, archivedAt: Date.now() });
      setAccount(updated);
      removeModal.close();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to archive");
    } finally {
      setRemoving(false);
    }
  };

  const handleUnarchive = async () => {
    if (!account) { return; }

    setUnarchiving(true);
    try {
      const { account: updated } = await patchAccount({ id: account.id, archivedAt: null });
      setAccount(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unarchive");
    } finally {
      setUnarchiving(false);
    }
  };

  const handleDelete = async () => {
    if (!account) { return; }

    setRemoving(true);
    try {
      await deleteAccount({ id: account.id });
      route("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
      setRemoving(false);
      removeModal.close();
    }
  };

  const handlePermanentDelete = async () => {
    if (!account) { return; }

    setDeleting(true);
    try {
      await deleteAccount({ id: account.id });
      route("/app/archived");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
      setDeleting(false);
      deleteModal.close();
    }
  };

  const handleStartEditName = () => {
    if (!account) { return; }
    setEditedName(account.name);
    setEditingName(true);
  };

  const handleCancelEditName = () => {
    setEditingName(false);
    setEditedName("");
  };

  const handleSaveName = async () => {
    if (!account || !editedName.trim()) { return; }

    setSavingName(true);
    try {
      const { account: updated } = await patchAccount({ id: account.id, name: editedName.trim() });
      setAccount(updated);
      setEditingName(false);
      setEditedName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update name");
    } finally {
      setSavingName(false);
    }
  };

  const handleBucketsChange = async (newBucketIds: Set<string>) => {
    if (!account) { return; }

    const previousBucketIds = accountBucketIds;
    setAccountBucketIds(newBucketIds);

    try {
      await putAccountBuckets({ id: account.id, bucketIds: Array.from(newBucketIds) });
    } catch (err) {
      setAccountBucketIds(previousBucketIds);
      setError(err instanceof Error ? err.message : "Failed to update buckets");
    }
  };

  if (loading) {
    return <AccountDetailSkeleton />;
  }

  if (error || !account) {
    return (
      <div>
        <PageHeader title="Error" backHref="/" />
        <p class="text-red-600 dark:text-red-400">{error || "Not found"}</p>
      </div>
    );
  }

  const latestMonth = Object.entries(editedHistory)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => b.localeCompare(a))[0];
  const latestValue = latestMonth?.[1] ?? 0;
  const isArchived = !!account.archivedAt;

  return (
    <div>
      <AccountHeader
        account={account}
        isEditing={editingName}
        editedName={editedName}
        saving={savingName}
        onStartEdit={handleStartEditName}
        onCancelEdit={handleCancelEditName}
        onSave={handleSaveName}
        onNameChange={setEditedName}
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
              <p class="text-sm text-amber-800 dark:text-amber-200">
                Archived on {new Date(account.archivedAt!).toLocaleDateString()}
              </p>
              <button
                onClick={handleUnarchive}
                disabled={unarchiving}
                class="text-sm text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200 font-medium hover:underline disabled:opacity-50"
              >
                {unarchiving ? "..." : "Unarchive"}
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
            <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Value History
            </h2>
          </div>

          <HistoryEditor
            history={editedHistory}
            onChange={handleHistoryChange}
            onBlur={handleBlur}
            currency={account.currency}
            savingMonths={savingMonths}
            savedMonths={savedMonths}
            disabled={isArchived}
            updateFrequency={account.updateFrequency}
          />
        </div>

        <BucketPicker
          selectedBucketIds={accountBucketIds}
          onChange={handleBucketsChange}
          preloadedBuckets={allBuckets}
          onBucketsChange={setAllBuckets}
        />

        <div class="pt-12 text-center">
          {isArchived ? (
            <button
              onClick={() => deleteModal.open()}
              class="inline-flex items-center gap-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm hover:underline"
            >
              <Trash2 size={16} />
              Permanently Delete
            </button>
          ) : (
            <button
              onClick={() => removeModal.open()}
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
        open={removeModal.isOpen}
        onClose={removeModal.close}
        onArchive={handleArchive}
        onDelete={handleDelete}
        accountType={account.type}
        loading={removing}
      />

      {/* Permanent Delete Modal - for archived accounts */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={handlePermanentDelete}
        title="Permanently Delete"
        confirmText="Delete"
        confirmVariant="danger"
        isLoading={deleting}
      >
        <p class="mb-4">
          This will permanently erase all records of this {account.type === "asset" ? "asset" : "debt"}, as if it never existed.
        </p>
        <p>
          Are you sure? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};
