import { EmptyState, Modal } from "@broccoliapps/browser";
import { AddBucketForm, BucketListItem, PageHeader } from "../components";
import { useBuckets } from "../hooks";

export const BucketsPage = () => {
  const b = useBuckets();

  if (b.isLoading) {
    return (
      <div>
        <PageHeader title="Buckets" backHref="/" />
        <p class="text-neutral-500 dark:text-neutral-400">Loading...</p>
      </div>
    );
  }

  if (b.error) {
    return (
      <div>
        <PageHeader title="Buckets" backHref="/" />
        <p class="text-red-600 dark:text-red-400">{b.error}</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Buckets" backHref="/" />

      <div class="space-y-4">
        {b.buckets.length === 0 && <EmptyState title="No buckets yet." description="Create one below to group your assets and debts." />}

        {b.buckets.map((bucket) => (
          <BucketListItem
            key={bucket.id}
            bucket={bucket}
            accounts={b.accounts}
            bucketAccountIds={b.accountsByBucket[bucket.id] || []}
            isExpanded={b.expandedBuckets.has(bucket.id)}
            isEditing={b.editingBucketId === bucket.id}
            editedName={b.editedName}
            savingName={b.savingName}
            savingAccounts={b.savingAccounts[bucket.id] || false}
            onToggleExpanded={() => b.toggleExpanded(bucket.id)}
            onStartEdit={() => b.startEdit(bucket)}
            onCancelEdit={b.cancelEdit}
            onSaveName={() => b.saveName(bucket.id)}
            onEditNameChange={b.setEditedName}
            onDelete={() => b.deleteModal.open(bucket)}
            onToggleAccount={(accountId) => b.toggleAccount(bucket.id, accountId)}
          />
        ))}

        <AddBucketForm value={b.newBucketName} onChange={b.setNewBucketName} onSubmit={b.create} isLoading={b.creatingBucket} />
      </div>

      <Modal
        isOpen={b.deleteModal.isOpen}
        onClose={b.deleteModal.close}
        onConfirm={b.remove}
        title="Delete Bucket"
        confirmText="Delete"
        confirmVariant="danger"
        isLoading={b.deleting}
      >
        <p>Are you sure you want to delete "{b.deleteModal.data?.name}"? Accounts will be unlinked but not deleted.</p>
      </Modal>
    </div>
  );
};
