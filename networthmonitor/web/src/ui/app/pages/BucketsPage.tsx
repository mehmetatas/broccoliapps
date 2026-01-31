import { EmptyState, Modal, useModal } from "@broccoliapps/browser";
import { useEffect, useState } from "preact/hooks";
import type { AccountDto, BucketDto } from "../../../shared/api-contracts/dto";
import {
  deleteBucket,
  getAccounts,
  getBucketAccounts,
  getBuckets,
  patchBucket,
  postBucket,
  putBucketAccounts,
} from "../api";
import { AddBucketForm, BucketListItem, PageHeader } from "../components";

export const BucketsPage = () => {
  const [buckets, setBuckets] = useState<BucketDto[]>([]);
  const [accounts, setAccounts] = useState<AccountDto[]>([]);
  const [accountsByBucket, setAccountsByBucket] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
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
        const [bucketsResult, accountsResult] = await Promise.all([
          getBuckets(),
          getAccounts(),
        ]);
        setBuckets(bucketsResult.buckets);
        setAccounts(accountsResult.accounts);

        // Fetch accounts for each bucket
        const accountsMap: Record<string, string[]> = {};
        await Promise.all(
          bucketsResult.buckets.map(async (bucket) => {
            const bucketAccounts = await getBucketAccounts(bucket.id);
            accountsMap[bucket.id] = bucketAccounts.accounts.map((a) => a.id);
          })
        );
        setAccountsByBucket(accountsMap);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCreateBucket = async () => {
    if (!newBucketName.trim()) {return;}

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

  const handleStartEdit = (bucket: BucketDto) => {
    setEditingBucketId(bucket.id);
    setEditedName(bucket.name);
  };

  const handleCancelEdit = () => {
    setEditingBucketId(null);
    setEditedName("");
  };

  const handleSaveName = async (bucketId: string) => {
    if (!editedName.trim()) {return;}

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

  const handleDeleteBucket = async () => {
    if (!deleteModal.data) {return;}

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

  const toggleBucketExpanded = (bucketId: string) => {
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

  const handleToggleAccount = async (bucketId: string, accountId: string) => {
    const currentAccounts = accountsByBucket[bucketId] || [];
    const isAdding = !currentAccounts.includes(accountId);
    const newAccountIds = isAdding
      ? [...currentAccounts, accountId]
      : currentAccounts.filter((id) => id !== accountId);

    // Optimistically update UI
    setAccountsByBucket((prev) => ({
      ...prev,
      [bucketId]: newAccountIds,
    }));

    setSavingAccounts((prev) => ({ ...prev, [bucketId]: true }));
    try {
      await putBucketAccounts(bucketId, newAccountIds);
    } catch (err) {
      // Revert on error
      setAccountsByBucket((prev) => ({
        ...prev,
        [bucketId]: currentAccounts,
      }));
      setError(err instanceof Error ? err.message : "Failed to update bucket");
    } finally {
      setSavingAccounts((prev) => ({ ...prev, [bucketId]: false }));
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Buckets" backHref="/" />
        <p class="text-neutral-500 dark:text-neutral-400">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Buckets" backHref="/" />
        <p class="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Buckets" backHref="/" />

      <div class="space-y-4">
        {buckets.length === 0 && (
          <EmptyState
            title="No buckets yet."
            description="Create one below to group your assets and debts."
          />
        )}

        {buckets.map((bucket) => (
          <BucketListItem
            key={bucket.id}
            bucket={bucket}
            accounts={accounts}
            bucketAccountIds={accountsByBucket[bucket.id] || []}
            isExpanded={expandedBuckets.has(bucket.id)}
            isEditing={editingBucketId === bucket.id}
            editedName={editedName}
            savingName={savingName}
            savingAccounts={savingAccounts[bucket.id] || false}
            onToggleExpanded={() => toggleBucketExpanded(bucket.id)}
            onStartEdit={() => handleStartEdit(bucket)}
            onCancelEdit={handleCancelEdit}
            onSaveName={() => handleSaveName(bucket.id)}
            onEditNameChange={setEditedName}
            onDelete={() => deleteModal.open(bucket)}
            onToggleAccount={(accountId) => handleToggleAccount(bucket.id, accountId)}
          />
        ))}

        <AddBucketForm
          value={newBucketName}
          onChange={setNewBucketName}
          onSubmit={handleCreateBucket}
          loading={creatingBucket}
        />
      </div>

      <Modal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={handleDeleteBucket}
        title="Delete Bucket"
        confirmText="Delete"
        confirmVariant="danger"
        isLoading={deleting}
      >
        <p>
          Are you sure you want to delete "{deleteModal.data?.name}"? Accounts will be unlinked but not deleted.
        </p>
      </Modal>
    </div>
  );
};
