import { useModal } from "@broccoliapps/browser";
import { route } from "preact-router";
import { useEffect, useState } from "preact/hooks";
import type { AccountDto, BucketDto } from "@broccoliapps/nwm-shared";
import {
  deleteAccount,
  deleteHistoryItem,
  getAccountDetail,
  patchAccount,
  postHistoryItem,
  putAccountBuckets,
} from "../api";

export const useAccountDetail = (id: string | undefined) => {
  const [account, setAccount] = useState<AccountDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
    if (!account) {
      return;
    }

    setSavingMonths((prev) => ({ ...prev, [month]: true }));

    try {
      await postHistoryItem({ id: account.id, month, value });
      setOriginalHistory((prev) => ({ ...prev, [month]: value }));
      showSaveSuccess(month);
    } catch (err) {
      setSavingMonths((prev) => ({ ...prev, [month]: false }));
      throw err;
    }
  };

  // Helper: Delete a single history item from server
  const deleteHistoryItemFromServer = async (month: string) => {
    if (!account) {
      return;
    }

    setSavingMonths((prev) => ({ ...prev, [month]: true }));

    try {
      await deleteHistoryItem({ id: account.id, month });
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
    if (!id) {
      return;
    }

    const fetchData = async () => {
      try {
        const result = await getAccountDetail(id);
        setAccount(result.account);
        setAccountBucketIds(new Set(result.accountBuckets.map((b) => b.id)));
        setAllBuckets(result.allBuckets);

        const historyMap = result.account.history ?? {};
        setOriginalHistory(historyMap);
        setEditedHistory({ ...historyMap });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleHistoryChange = async (month: string, value: number | undefined) => {
    const previousValue = editedHistory[month];
    setEditedHistory((prev) => ({ ...prev, [month]: value }));

    if (value === undefined && originalHistory[month] !== undefined) {
      try {
        await deleteHistoryItemFromServer(month);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete entry");
        setEditedHistory((prev) => ({ ...prev, [month]: previousValue }));
      }
    }
  };

  const handleBlur = async (month: string) => {
    if (!account) {
      return;
    }

    const currentValue = editedHistory[month];
    const originalValue = originalHistory[month];

    if (currentValue === originalValue) {
      return;
    }
    if (currentValue === undefined && originalValue === undefined) {
      return;
    }
    if (currentValue === undefined) {
      return;
    }

    try {
      await saveHistoryItem(month, currentValue);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes");
    }
  };

  const handleArchive = async () => {
    if (!account) {
      return;
    }

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
    if (!account) {
      return;
    }

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
    if (!account) {
      return;
    }

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
    if (!account) {
      return;
    }

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
    if (!account) {
      return;
    }
    setEditedName(account.name);
    setEditingName(true);
  };

  const handleCancelEditName = () => {
    setEditingName(false);
    setEditedName("");
  };

  const handleSaveName = async () => {
    if (!account || !editedName.trim()) {
      return;
    }

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
    if (!account) {
      return;
    }

    const previousBucketIds = accountBucketIds;
    setAccountBucketIds(newBucketIds);

    try {
      await putAccountBuckets({ id: account.id, bucketIds: Array.from(newBucketIds) });
    } catch (err) {
      setAccountBucketIds(previousBucketIds);
      setError(err instanceof Error ? err.message : "Failed to update buckets");
    }
  };

  return {
    account,
    isLoading,
    error,
    // History
    editedHistory,
    originalHistory,
    savingMonths,
    savedMonths,
    handleHistoryChange,
    handleBlur,
    // Name editing
    editingName,
    editedName,
    savingName,
    setEditedName,
    handleStartEditName,
    handleCancelEditName,
    handleSaveName,
    // Buckets
    accountBucketIds,
    allBuckets,
    setAllBuckets,
    handleBucketsChange,
    // Remove/Archive/Delete
    removeModal,
    removing,
    handleArchive,
    handleDelete,
    deleteModal,
    deleting,
    handlePermanentDelete,
    unarchiving,
    handleUnarchive,
  };
};
