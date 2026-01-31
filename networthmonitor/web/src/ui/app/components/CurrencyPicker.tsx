import { DropdownButton, useClickOutside } from "@broccoliapps/browser";
import { useCallback, useRef, useState } from "preact/hooks";
import { getCurrencies } from "../../../shared/currency";

type CurrencyPickerProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

const POPULAR_CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "CNY", "INR", "MXN"];
const ALL_CURRENCIES = getCurrencies().sort();

export const CurrencyPicker = ({ value, onChange, placeholder = "Select currency" }: CurrencyPickerProps) => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const closeDropdown = useCallback(() => setOpen(false), []);
  useClickOutside(containerRef, closeDropdown, open);

  const filteredCurrencies = ALL_CURRENCIES.filter((c) =>
    c.toLowerCase().includes(search.toLowerCase())
  );

  const sortedCurrencies = [
    ...POPULAR_CURRENCIES.filter((c) => filteredCurrencies.includes(c)),
    ...filteredCurrencies.filter((c) => !POPULAR_CURRENCIES.includes(c)),
  ];

  const handleSelect = (currency: string) => {
    onChange(currency);
    setOpen(false);
    setSearch("");
  };

  return (
    <div ref={containerRef} class="relative">
      <DropdownButton
        onClick={() => setOpen(!open)}
        value={value}
        placeholder={placeholder}
      />

      {open && (
        <div class="absolute z-50 mt-1 w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg">
          <div class="p-2 border-b border-neutral-200 dark:border-neutral-700">
            <input
              type="text"
              value={search}
              onInput={(e) => setSearch((e.target as HTMLInputElement).value)}
              placeholder="Filter..."
              class="w-full px-3 py-2 rounded border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
              autoFocus
            />
          </div>
          <ul class="max-h-48 overflow-y-auto py-1">
            {sortedCurrencies.map((currency) => (
              <li key={currency}>
                <button
                  type="button"
                  onClick={() => handleSelect(currency)}
                  class={`w-full px-4 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 ${value === currency
                      ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium"
                      : "text-neutral-700 dark:text-neutral-300"
                    }`}
                >
                  {currency}
                </button>
              </li>
            ))}
            {sortedCurrencies.length === 0 && (
              <li class="px-4 py-2 text-sm text-neutral-400 dark:text-neutral-500">No currencies found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
