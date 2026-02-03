import { useModal } from "@broccoliapps/browser";
import type { AccountDto, BucketDto } from "@broccoliapps/nwm-shared";
import { useEffect, useState } from "preact/hooks";
import { deleteBucket, getAccounts, getBucketAccounts, getBuckets, patchBucket, postBucket, putBucketAccounts } from "../api";

export const useBuckets = () => {
  const [buckets, setBuckets] = useState<BucketDto[]>([]);
  const [accounts, setAccounts] = useState<AccountDto[]>([]);
  const [accountsByBucket, setAccountsByBucket] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New bucket form
  const [newBucketName, setNewBucketName] = useState("");
  const [creatingBucket, setCreatingBucket] = useState(false);

  // Editing state
  const [editingBucketId, setEditingBucketId] = useState<string | null>(null);
  const [editedName, setEditedName] = useState("");
  const [savingName, setSavingName] = useState(false);

  // Expanded buckets
  const [expandedBuckets, setExpandedBuckets] = useState<Set<string>>(new Set());

  // Delete modal
  const deleteModal = useModal<BucketDto>();
  const [deleting, setDeleting] = useState(false);

  // Saving account associations
  const [savingAccounts, setSavingAccounts] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bucketsResult, accountsResult] = await Promise.all([getBuckets(), getAccounts()]);
        setBuckets(bucketsResult.buckets);
        setAccounts(accountsResult.accounts);

        const accountsMap: Record<string, string[]> = {};
        await Promise.all(
          bucketsResult.buckets.map(async (bucket) => {
            const bucketAccounts = await getBucketAccounts(bucket.id);
            accountsMap[bucket.id] = bucketAccounts.accounts.map((a) => a.id);
          }),
        );
        setAccountsByBucket(accountsMap);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const create = async () => {
    if (!newBucketName.trim()) {
      return;
    }

    setCreatingBucket(true);
    try {
      const { bucket } = await postBucket({ name: newBucketName.trim() });
      setBuckets((prev) => [...prev, bucket]);
      setAccountsByBucket((prev) => ({ ...prev, [bucket.id]: [] }));
      setNewBucketName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create bucket");
    } finally {
      setCreatingBucket(false);
    }
  };

  const startEdit = (bucket: BucketDto) => {
    setEditingBucketId(bucket.id);
    setEditedName(bucket.name);
  };

  const cancelEdit = () => {
    setEditingBucketId(null);
    setEditedName("");
  };

  const saveName = async (bucketId: string) => {
    if (!editedName.trim()) {
      return;
    }

    setSavingName(true);
    try {
      const { bucket: updated } = await patchBucket({ id: bucketId, name: editedName.trim() });
      setBuckets((prev) => prev.map((b) => (b.id === bucketId ? updated : b)));
      setEditingBucketId(null);
      setEditedName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update bucket");
    } finally {
      setSavingName(false);
    }
  };

  const remove = async () => {
    if (!deleteModal.data) {
      return;
    }

    setDeleting(true);
    try {
      await deleteBucket({ id: deleteModal.data.id });
      setBuckets((prev) => prev.filter((b) => b.id !== deleteModal.data!.id));
      setAccountsByBucket((prev) => {
        const updated = { ...prev };
        delete updated[deleteModal.data!.id];
        return updated;
      });
      deleteModal.close();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete bucket");
    } finally {
      setDeleting(false);
    }
  };

  const toggleExpanded = (bucketId: string) => {
    setExpandedBuckets((prev) => {
      const next = new Set(prev);
      if (next.has(bucketId)) {
        next.delete(bucketId);
      } else {
        next.add(bucketId);
      }
      return next;
    });
  };

  const toggleAccount = async (bucketId: string, accountId: string) => {
    const currentAccounts = accountsByBucket[bucketId] || [];
    const isAdding = !currentAccounts.includes(accountId);
    const newAccountIds = isAdding ? [...currentAccounts, accountId] : currentAccounts.filter((id) => id !== accountId);

    // Optimistic update
    setAccountsByBucket((prev) => ({ ...prev, [bucketId]: newAccountIds }));

    setSavingAccounts((prev) => ({ ...prev, [bucketId]: true }));
    try {
      await putBucketAccounts(bucketId, newAccountIds);
    } catch (err) {
      setAccountsByBucket((prev) => ({ ...prev, [bucketId]: currentAccounts }));
      setError(err instanceof Error ? err.message : "Failed to update bucket");
    } finally {
      setSavingAccounts((prev) => ({ ...prev, [bucketId]: false }));
    }
  };

  return {
    buckets,
    accounts,
    accountsByBucket,
    isLoading,
    error,
    // Create
    newBucketName,
    setNewBucketName,
    creatingBucket,
    create,
    // Edit name
    editingBucketId,
    editedName,
    setEditedName,
    savingName,
    startEdit,
    cancelEdit,
    saveName,
    // Expand/collapse
    expandedBuckets,
    toggleExpanded,
    // Delete
    deleteModal,
    deleting,
    remove,
    // Account associations
    savingAccounts,
    toggleAccount,
  };
};
