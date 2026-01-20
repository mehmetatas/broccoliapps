import { Check, ChevronDown, ChevronRight, Loader2, Pencil, Plus, Trash2, X } from "lucide-preact";
import { useEffect, useState } from "preact/hooks";
import type { Account } from "../../../db/accounts";
import type { Bucket } from "../../../db/buckets";
import {
  deleteBucket,
  getAccounts,
  getBucketAccounts,
  getBuckets,
  patchBucket,
  postBucket,
  putBucketAccounts,
} from "../../../shared/api-contracts";
import { Button, Modal, PageHeader } from "../components";

export const BucketsPage = () => {
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
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
  const [deletingBucket, setDeletingBucket] = useState<Bucket | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Saving account associations
  const [savingAccounts, setSavingAccounts] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bucketsResult, accountsResult] = await Promise.all([
          getBuckets.invoke(),
          getAccounts.invoke(),
        ]);
        setBuckets(bucketsResult);
        setAccounts(accountsResult);

        // Fetch accounts for each bucket
        const accountsMap: Record<string, string[]> = {};
        await Promise.all(
          bucketsResult.map(async (bucket) => {
            const bucketAccounts = await getBucketAccounts.invoke({ id: bucket.id });
            accountsMap[bucket.id] = bucketAccounts.map((a) => a.id);
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
    if (!newBucketName.trim()) return;

    setCreatingBucket(true);
    try {
      const bucket = await postBucket.invoke({ name: newBucketName.trim() });
      setBuckets((prev) => [...prev, bucket]);
      setAccountsByBucket((prev) => ({ ...prev, [bucket.id]: [] }));
      setNewBucketName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create bucket");
    } finally {
      setCreatingBucket(false);
    }
  };

  const handleStartEdit = (bucket: Bucket) => {
    setEditingBucketId(bucket.id);
    setEditedName(bucket.name);
  };

  const handleCancelEdit = () => {
    setEditingBucketId(null);
    setEditedName("");
  };

  const handleSaveName = async (bucketId: string) => {
    if (!editedName.trim()) return;

    setSavingName(true);
    try {
      const updated = await patchBucket.invoke({ id: bucketId, name: editedName.trim() });
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
    if (!deletingBucket) return;

    setDeleting(true);
    try {
      await deleteBucket.invoke({ id: deletingBucket.id });
      setBuckets((prev) => prev.filter((b) => b.id !== deletingBucket.id));
      setAccountsByBucket((prev) => {
        const updated = { ...prev };
        delete updated[deletingBucket.id];
        return updated;
      });
      setDeletingBucket(null);
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
      await putBucketAccounts.invoke({ id: bucketId, accountIds: newAccountIds });
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
          <p class="text-neutral-500 dark:text-neutral-400 text-center py-8">
            No buckets yet. Create one below to group your assets and debts.
          </p>
        )}

        {buckets.map((bucket) => {
          const isExpanded = expandedBuckets.has(bucket.id);
          const bucketAccountIds = accountsByBucket[bucket.id] || [];
          const bucketAccounts = accounts.filter((a) => bucketAccountIds.includes(a.id));
          const assetCount = bucketAccounts.filter((a) => a.type === "asset").length;
          const debtCount = bucketAccounts.filter((a) => a.type === "debt").length;

          return (
            <div
              key={bucket.id}
              class="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700"
            >
              <div class="p-4">
                <div class="flex items-center gap-3">
                  <button
                    onClick={() => toggleBucketExpanded(bucket.id)}
                    class="p-1 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors"
                  >
                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  </button>

                  {editingBucketId === bucket.id ? (
                    <div class="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={editedName}
                        onInput={(e) => setEditedName((e.target as HTMLInputElement).value)}
                        class="flex-1 px-3 py-1.5 text-sm bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveName(bucket.id);
                          if (e.key === "Escape") handleCancelEdit();
                        }}
                      />
                      {savingName ? (
                        <span class="p-1.5 text-neutral-500">
                          <Loader2 size={18} class="animate-spin" />
                        </span>
                      ) : (
                        <>
                          <button
                            onClick={() => handleSaveName(bucket.id)}
                            class="p-1.5 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors"
                          >
                            <Check size={18} />
                          </button>
                          <button
                            onClick={handleCancelEdit}
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
                        <span class="font-medium text-neutral-900 dark:text-neutral-100">
                          {bucket.name}
                        </span>
                        <span class="text-xs text-neutral-500 dark:text-neutral-400">
                          {assetCount > 0 && `${assetCount} ${assetCount === 1 ? "asset" : "assets"}`}
                          {assetCount > 0 && debtCount > 0 && ", "}
                          {debtCount > 0 && `${debtCount} ${debtCount === 1 ? "debt" : "debts"}`}
                          {assetCount === 0 && debtCount === 0 && "empty"}
                        </span>
                        {savingAccounts[bucket.id] && (
                          <Loader2 size={14} class="animate-spin text-neutral-400" />
                        )}
                      </div>
                      <button
                        onClick={() => handleStartEdit(bucket)}
                        class="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => setDeletingBucket(bucket)}
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
                  {(() => {
                    const openAccounts = accounts.filter((a) => !a.closedAt);
                    return openAccounts.length === 0 ? (
                      <p class="text-sm text-neutral-500 dark:text-neutral-400">
                        No accounts available
                      </p>
                    ) : (
                      <div class="space-y-4">
                        {/* Assets */}
                        {openAccounts.some((a) => a.type === "asset") && (
                          <div>
                            <p class="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
                              Assets
                            </p>
                            <div class="flex flex-wrap gap-2">
                              {[...openAccounts]
                                .filter((a) => a.type === "asset")
                              .sort((a, b) => {
                                const aSelected = bucketAccountIds.includes(a.id);
                                const bSelected = bucketAccountIds.includes(b.id);
                                if (aSelected !== bSelected) return bSelected ? 1 : -1;
                                return a.name.localeCompare(b.name);
                              })
                              .map((account) => {
                                const isSelected = bucketAccountIds.includes(account.id);
                                return (
                                  <button
                                    key={account.id}
                                    type="button"
                                    onClick={() => handleToggleAccount(bucket.id, account.id)}
                                    class={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all active:scale-95 ${isSelected
                                        ? "bg-teal-600 dark:bg-teal-600 text-white shadow-sm"
                                        : "bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600"
                                      }`}
                                  >
                                    {isSelected && <Check size={14} class="shrink-0" />}
                                    {account.name}
                                  </button>
                                );
                              })}
                          </div>
                        </div>
                      )}
                        {/* Debts */}
                        {openAccounts.some((a) => a.type === "debt") && (
                          <div>
                            <p class="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
                              Debts
                            </p>
                            <div class="flex flex-wrap gap-2">
                              {[...openAccounts]
                                .filter((a) => a.type === "debt")
                              .sort((a, b) => {
                                const aSelected = bucketAccountIds.includes(a.id);
                                const bSelected = bucketAccountIds.includes(b.id);
                                if (aSelected !== bSelected) return bSelected ? 1 : -1;
                                return a.name.localeCompare(b.name);
                              })
                              .map((account) => {
                                const isSelected = bucketAccountIds.includes(account.id);
                                return (
                                  <button
                                    key={account.id}
                                    type="button"
                                    onClick={() => handleToggleAccount(bucket.id, account.id)}
                                    class={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all active:scale-95 ${isSelected
                                        ? "bg-red-600 dark:bg-red-500 text-white shadow-sm"
                                        : "bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600"
                                      }`}
                                  >
                                    {isSelected && <Check size={14} class="shrink-0" />}
                                    {account.name}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          );
        })}

        {/* Add Bucket Form */}
        <div class="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
          <div class="flex items-center gap-3">
            <input
              type="text"
              value={newBucketName}
              onInput={(e) => setNewBucketName((e.target as HTMLInputElement).value)}
              placeholder="New bucket name"
              class="flex-1 px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateBucket();
              }}
            />
            <Button
              onClick={handleCreateBucket}
              disabled={!newBucketName.trim() || creatingBucket}
            >
              {creatingBucket ? (
                <Loader2 size={18} class="animate-spin" />
              ) : (
                <Plus size={18} />
              )}
            </Button>
          </div>
        </div>
      </div>

      <Modal open={!!deletingBucket} onClose={() => setDeletingBucket(null)}>
        <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
          Delete Bucket
        </h3>
        <p class="text-neutral-600 dark:text-neutral-400 mb-6">
          Are you sure you want to delete "{deletingBucket?.name}"? Accounts will be unlinked but not deleted.
        </p>
        <div class="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => setDeletingBucket(null)}
            class="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteBucket}
            disabled={deleting}
            class="flex-1"
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </Modal>
    </div>
  );
};
