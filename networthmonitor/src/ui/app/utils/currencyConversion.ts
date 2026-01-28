import type { AccountDto } from "../../../shared/api-contracts/dto";

/**
 * Map of currency -> month -> exchange rate
 * The rate converts from that currency TO the target currency
 */
export type ExchangeRateMap = Record<string, Record<string, number>>;

/**
 * Get unique currencies from accounts that need conversion (excluding target currency)
 */
export const getUniqueCurrencies = (
  accounts: AccountDto[],
  targetCurrency: string
): string[] => {
  const currencies = new Set<string>();
  for (const account of accounts) {
    if (account.currency !== targetCurrency) {
      currencies.add(account.currency);
    }
  }
  return Array.from(currencies);
};

/**
 * Find the earliest month from all account histories
 */
export const getEarliestMonth = (
  accountHistories: Record<string, Record<string, number>>
): string | null => {
  let earliest: string | null = null;
  for (const history of Object.values(accountHistories)) {
    for (const month of Object.keys(history)) {
      if (!earliest || month < earliest) {
        earliest = month;
      }
    }
  }
  return earliest;
};

/**
 * Get the rate for a specific month, using carry-forward if exact month not available
 */
const getRateForMonth = (
  rates: Record<string, number>,
  month: string
): number | undefined => {
  // Direct match
  if (rates[month] !== undefined) {
    return rates[month];
  }

  // Find closest available rate (carry forward from earlier month)
  const sortedMonths = Object.keys(rates).sort((a, b) => a.localeCompare(b));
  let closestRate: number | undefined;

  for (const m of sortedMonths) {
    if (m <= month) {
      closestRate = rates[m];
    } else {
      break;
    }
  }

  return closestRate;
};

/**
 * Convert a value from one currency to target currency for a specific month
 */
export const convertValue = (
  value: number,
  fromCurrency: string,
  month: string,
  rates: ExchangeRateMap,
  targetCurrency: string
): number => {
  // No conversion needed
  if (fromCurrency === targetCurrency) {
    return value;
  }

  const currencyRates = rates[fromCurrency];
  if (!currencyRates) {
    return value; // No rates available, return original
  }

  const rate = getRateForMonth(currencyRates, month);
  if (!rate || rate === 0) {
    return value; // Invalid rate, return original
  }

  return value * rate;
};

/**
 * Convert latest values for all accounts to target currency
 */
export const convertLatestValues = (
  accounts: AccountDto[],
  latestValues: Record<string, number>,
  currentMonth: string,
  rates: ExchangeRateMap,
  targetCurrency: string
): Record<string, number> => {
  const converted: Record<string, number> = {};

  for (const account of accounts) {
    const value = latestValues[account.id];
    if (value === undefined) {
      continue;
    }

    converted[account.id] = convertValue(
      value,
      account.currency,
      currentMonth,
      rates,
      targetCurrency
    );
  }

  return converted;
};
