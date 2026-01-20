import { ChevronRight, CreditCard, TrendingUp } from "lucide-preact";
import type { Account } from "../../../db/accounts";

type AccountCardProps = {
  account: Account;
  latestValue?: number;
  onClick: () => void;
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const AccountCard = ({ account, latestValue, onClick }: AccountCardProps) => {
  return (
    <button
      onClick={onClick}
      class="w-full flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 transition-colors text-left"
    >
      <div class={`p-3 rounded-lg ${account.type === "asset"
        ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400"
        : "bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400"
        }`}>
        {account.type === "asset" ? <TrendingUp size={24} /> : <CreditCard size={24} />}
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-baseline justify-between gap-2">
          <span class="font-medium text-neutral-900 dark:text-neutral-100 truncate">
            {account.name}
          </span>
          {latestValue !== undefined && (
            <span class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 shrink-0">
              {formatCurrency(latestValue)}
            </span>
          )}
        </div>
      </div>
      <div class="text-neutral-400 dark:text-neutral-500">
        <ChevronRight size={20} />
      </div>
    </button>
  );
};
