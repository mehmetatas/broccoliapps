import type { AccountDto } from "@broccoliapps/nwm-shared";
import { type ExchangeRateMap, convertValue } from "./currencyConversion";
import { generateMonthRangeAscending, getCurrentMonth } from "./dateUtils";

type HistoryItem = { month: string; value: number };

/**
 * Convert an array of history items to a map (Record<string, number>)
 */
export const historyItemsToMap = (items: HistoryItem[]): Record<string, number> => {
  const map: Record<string, number> = {};
  for (const item of items) {
    map[item.month] = item.value;
  }
  return map;
};

/**
 * Convert a history map to an array of history items
 */
export const historyMapToItems = (
  map: Record<string, number | undefined>
): HistoryItem[] => {
  const items: HistoryItem[] = [];
  for (const [month, value] of Object.entries(map)) {
    if (value !== undefined) {
      items.push({ month, value });
    }
  }
  return items;
};

/**
 * Fill missing months in history data with carry-forward values up to the current month
 */
export const fillToCurrentMonth = (
  data: Record<string, number | undefined>
): Record<string, number | undefined> => {
  // Get entries with defined values
  const entries = Object.entries(data).filter(
    (entry): entry is [string, number] => entry[1] !== undefined
  );

  if (entries.length === 0) {
    return data;
  }

  // Find earliest month from data
  const sortedMonths = entries.map(([m]) => m).sort((a, b) => a.localeCompare(b));
  const earliestMonth = sortedMonths[0]!;

  // Get current month
  const currentMonth = getCurrentMonth();

  // Generate all months from earliest to current
  const allMonths = generateMonthRangeAscending(earliestMonth, currentMonth);

  // Build filled data with carry-forward
  const filled: Record<string, number | undefined> = {};
  let lastKnownValue: number | undefined;

  for (const month of allMonths) {
    if (data[month] !== undefined) {
      lastKnownValue = data[month];
    }
    filled[month] = lastKnownValue;
  }

  return filled;
};

/**
 * Calculate net worth by month with carry-forward logic
 * Returns a Record<string, number> where keys are months and values are net worth
 *
 * For active accounts: carry forward the last known value to current month
 * For archived accounts: only use actual history data, no carry forward (drops to 0 after last entry)
 */
export const calculateNetWorth = (
  accounts: AccountDto[],
  accountHistories: Record<string, Record<string, number>>
): Record<string, number> => {
  const currentMonth = getCurrentMonth();

  // Find earliest month from all account histories
  let earliestMonth = currentMonth;
  for (const account of accounts) {
    const history = accountHistories[account.id];
    if (history) {
      for (const month of Object.keys(history)) {
        if (month < earliestMonth) {
          earliestMonth = month;
        }
      }
    }
  }

  // Generate all months from earliest to current
  const sortedMonths = generateMonthRangeAscending(earliestMonth, currentMonth);

  // For archived accounts, find their last month with data
  const lastMonthWithData: Record<string, string> = {};
  for (const account of accounts) {
    if (account.archivedAt) {
      const history = accountHistories[account.id];
      if (history) {
        const months = Object.keys(history).sort((a, b) => b.localeCompare(a));
        if (months.length > 0) {
          lastMonthWithData[account.id] = months[0]!;
        }
      }
    }
  }

  // Calculate net worth by month with carry-forward
  const netWorthByMonth: Record<string, number> = {};
  const lastKnownValue: Record<string, number> = {};

  for (const month of sortedMonths) {
    let total = 0;
    for (const account of accounts) {
      const history = accountHistories[account.id];
      const isArchived = !!account.archivedAt;

      if (history && history[month] !== undefined) {
        lastKnownValue[account.id] = history[month];
      }

      // For archived accounts, don't carry forward past their last data point
      let value = 0;
      if (isArchived) {
        const lastMonth = lastMonthWithData[account.id];
        if (lastMonth && month <= lastMonth) {
          value = lastKnownValue[account.id] ?? 0;
        }
        // else: month is after last data point, value stays 0
      } else {
        value = lastKnownValue[account.id] ?? 0;
      }

      if (account.type === "asset") {
        total += value;
      } else {
        total -= value;
      }
    }
    netWorthByMonth[month] = total;
  }

  return netWorthByMonth;
};

/**
 * Get the latest value from a history map
 */
export const getLatestValue = (
  history: Record<string, number | undefined>
): number | undefined => {
  const entries = Object.entries(history)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => b.localeCompare(a));

  return entries[0]?.[1];
};

/**
 * Calculate net worth by month with currency conversion
 * All values are converted to the target currency using exchange rates
 */
export const calculateNetWorthWithConversion = (
  accounts: AccountDto[],
  accountHistories: Record<string, Record<string, number>>,
  exchangeRates: ExchangeRateMap,
  targetCurrency: string
): Record<string, number> => {
  const currentMonth = getCurrentMonth();

  // Find earliest month from all account histories
  let earliestMonth = currentMonth;
  for (const account of accounts) {
    const history = accountHistories[account.id];
    if (history) {
      for (const month of Object.keys(history)) {
        if (month < earliestMonth) {
          earliestMonth = month;
        }
      }
    }
  }

  // Generate all months from earliest to current
  const sortedMonths = generateMonthRangeAscending(earliestMonth, currentMonth);

  // For archived accounts, find their last month with data
  const lastMonthWithData: Record<string, string> = {};
  for (const account of accounts) {
    if (account.archivedAt) {
      const history = accountHistories[account.id];
      if (history) {
        const months = Object.keys(history).sort((a, b) => b.localeCompare(a));
        if (months.length > 0) {
          lastMonthWithData[account.id] = months[0]!;
        }
      }
    }
  }

  // Calculate net worth by month with carry-forward and conversion
  const netWorthByMonth: Record<string, number> = {};
  const lastKnownValue: Record<string, number> = {};

  for (const month of sortedMonths) {
    let total = 0;
    for (const account of accounts) {
      const history = accountHistories[account.id];
      const isArchived = !!account.archivedAt;

      if (history && history[month] !== undefined) {
        lastKnownValue[account.id] = history[month];
      }

      // For archived accounts, don't carry forward past their last data point
      let value = 0;
      if (isArchived) {
        const lastMonth = lastMonthWithData[account.id];
        if (lastMonth && month <= lastMonth) {
          value = lastKnownValue[account.id] ?? 0;
        }
        // else: month is after last data point, value stays 0
      } else {
        value = lastKnownValue[account.id] ?? 0;
      }

      // Convert value to target currency
      const convertedValue = convertValue(
        value,
        account.currency,
        month,
        exchangeRates,
        targetCurrency
      );

      if (account.type === "asset") {
        total += convertedValue;
      } else {
        total -= convertedValue;
      }
    }
    netWorthByMonth[month] = total;
  }

  return netWorthByMonth;
};
