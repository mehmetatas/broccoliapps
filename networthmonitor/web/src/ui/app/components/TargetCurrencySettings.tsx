import { CurrencyPicker } from "./CurrencyPicker";

type TargetCurrencySettingsProps = {
  value: string;
  onChange: (currency: string) => void;
  saving?: boolean;
  saved?: boolean;
};

export const TargetCurrencySettings = ({ value, onChange, saving = false, saved = false }: TargetCurrencySettingsProps) => {
  return (
    <div>
      <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
        Target Currency
        {saving && <span class="ml-2 text-xs text-neutral-500">Saving...</span>}
        {saved && <span class="ml-2 text-xs text-green-600 dark:text-green-400">Saved</span>}
      </label>
      <CurrencyPicker value={value} onChange={onChange} />
      <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Your net worth will be displayed in this currency.</p>
    </div>
  );
};
