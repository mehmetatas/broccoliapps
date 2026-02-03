import { preferences } from "@broccoliapps/browser";
import type { AccountDto } from "@broccoliapps/nwm-shared";
import { ChevronRight, CreditCard, TrendingUp } from "lucide-preact";
import { AppLink } from "../SpaApp";
import { hasMissedUpdate } from "../utils/dateUtils";
import { MoneyDisplay } from "./MoneyDisplay";

type AccountCardProps = {
  account: AccountDto;
  value?: number; // Original value in account's currency
};

export const AccountCard = ({ account, value }: AccountCardProps) => {
  const targetCurrency = (preferences.getAllSync()?.targetCurrency as string) || "USD";
  const showOriginal = account.currency !== targetCurrency;
  const needsUpdate = hasMissedUpdate(account.nextUpdate);

  return (
    <AppLink
      href={`/accounts/${account.id}`}
      class="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 transition-colors"
    >
      <div
        class={`relative p-3 rounded-lg ${
          account.type === "asset"
            ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400"
            : "bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400"
        }`}
      >
        {account.type === "asset" ? <TrendingUp size={24} /> : <CreditCard size={24} />}
        {needsUpdate && <span class="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full" />}
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between gap-2">
          <span class="font-medium text-neutral-900 dark:text-neutral-100 truncate">{account.name}</span>
          {value !== undefined && (
            <div class="text-right shrink-0">
              <MoneyDisplay amount={value} currency={account.currency} convert={true} />
              {showOriginal && <MoneyDisplay amount={value} currency={account.currency} size="sm" />}
            </div>
          )}
        </div>
      </div>
      <div class="text-neutral-400 dark:text-neutral-500">
        <ChevronRight size={20} />
      </div>
    </AppLink>
  );
};
