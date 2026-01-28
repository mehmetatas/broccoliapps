import { Check } from "lucide-preact";
import type { AccountDto } from "../../../shared/api-contracts/dto";

type AccountTypeSectionProps = {
  title: string;
  accounts: AccountDto[];
  selectedAccountIds: string[];
  onToggleAccount: (accountId: string) => void;
  selectedColor: string;
};

export const AccountTypeSection = ({
  title,
  accounts,
  selectedAccountIds,
  onToggleAccount,
  selectedColor,
}: AccountTypeSectionProps) => {
  if (accounts.length === 0) {return null;}

  const sortedAccounts = [...accounts].sort((a, b) => {
    const aSelected = selectedAccountIds.includes(a.id);
    const bSelected = selectedAccountIds.includes(b.id);
    if (aSelected !== bSelected) {return bSelected ? 1 : -1;}
    return a.name.localeCompare(b.name);
  });

  return (
    <div>
      <p class="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
        {title}
      </p>
      <div class="flex flex-wrap gap-2">
        {sortedAccounts.map((account) => {
          const isSelected = selectedAccountIds.includes(account.id);
          return (
            <button
              key={account.id}
              type="button"
              onClick={() => onToggleAccount(account.id)}
              class={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all active:scale-95 ${
                isSelected
                  ? `${selectedColor} text-white shadow-sm`
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
  );
};
