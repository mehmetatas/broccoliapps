import type { AccountDto } from "../../../shared/api-contracts/dto";
import { AccountCard } from "./AccountCard";
import { MoneyDisplay } from "./MoneyDisplay";

type AccountListProps = {
  title: string;
  accounts: AccountDto[];
  latestValues: Record<string, number>; // Converted values in target currency
  originalValues: Record<string, number>; // Original values in account's currency
  displayCurrency: string; // Target currency for display
};

export const AccountList = ({
  title,
  accounts,
  latestValues,
  originalValues,
  displayCurrency,
}: AccountListProps) => {
  if (accounts.length === 0) {
    return null;
  }

  // Sort by latest value (converted) descending
  const sortedAccounts = [...accounts].sort((a, b) => {
    const valueA = latestValues[a.id] ?? 0;
    const valueB = latestValues[b.id] ?? 0;
    return valueB - valueA;
  });

  // Calculate total of shown accounts (converted values)
  const total = accounts.reduce((sum, account) => sum + (latestValues[account.id] ?? 0), 0);

  return (
    <div>
      <div class="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 mb-3">
        <h2 class="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">
          {title}
        </h2>
        <MoneyDisplay amount={total} currency={displayCurrency} size="lg" />
      </div>
      <div class="space-y-2">
        {sortedAccounts.map((account) => (
          <AccountCard
            key={account.id}
            account={account}
            value={originalValues[account.id]}
          />
        ))}
      </div>
    </div>
  );
};
