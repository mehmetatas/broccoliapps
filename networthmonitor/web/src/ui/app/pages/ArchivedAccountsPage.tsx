import { EmptyState, preferences } from "@broccoliapps/browser";
import { Archive } from "lucide-preact";
import { ArchivedAccountCard, PageHeader } from "../components";
import { useArchivedAccounts } from "../hooks";

export const ArchivedAccountsPage = () => {
  const targetCurrency = (preferences.getAllSync()?.targetCurrency as string) || "USD";
  const { archivedAccounts, archivedAssets, archivedDebts, maxValues, isLoading, error } = useArchivedAccounts(targetCurrency);

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Archived" backHref="/" />
        <p class="text-neutral-500 dark:text-neutral-400">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Archived" backHref="/" />
        <p class="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Archived" backHref="/" />

      {archivedAccounts.length === 0 ? (
        <EmptyState
          icon={<Archive size={48} />}
          title="No archived accounts"
          description="When you archive an asset or debt, it will appear here. Archiving hides it from your dashboard while preserving your net worth history."
        />
      ) : (
        <div class="space-y-8">
          {archivedAssets.length > 0 && (
            <section>
              <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                Archived Assets
              </h2>
              <div class="space-y-3">
                {archivedAssets.map((asset) => (
                  <ArchivedAccountCard
                    key={asset.id}
                    account={asset}
                    maxValue={maxValues[asset.id] ?? 0}
                  />
                ))}
              </div>
            </section>
          )}

          {archivedDebts.length > 0 && (
            <section>
              <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                Archived Debts
              </h2>
              <div class="space-y-3">
                {archivedDebts.map((debt) => (
                  <ArchivedAccountCard
                    key={debt.id}
                    account={debt}
                    maxValue={maxValues[debt.id] ?? 0}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};
