import { HttpError } from "@broccoliapps/backend";
import { exchangeRates } from "../../db/currencyRates";
import { getExchangeRates } from "@broccoliapps/nwm-shared";
import { api } from "../lambda";

// GET /exchange-rates/:fromCurrency/:toCurrency - get historical exchange rates
api.register(getExchangeRates, async (req, res) => {
  const { fromCurrency, toCurrency, after } = req;

  if (fromCurrency === toCurrency) {
    throw new HttpError(400, "fromCurrency and toCurrency must be different");
  }

  // Get current month in yyyy-mm format
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Generate all months in range
  const months: string[] = [];
  const startParts = after.split("-").map(Number);
  const endParts = currentMonth.split("-").map(Number);
  const startYearNum = startParts[0] ?? 0;
  const startMonthNum = startParts[1] ?? 1;
  const endYearNum = endParts[0] ?? 0;
  const endMonthNum = endParts[1] ?? 1;

  let year = startYearNum;
  let month = startMonthNum;
  while (year < endYearNum || year === endYearNum && month <= endMonthNum) {
    months.push(`${year}-${String(month).padStart(2, "0")}`);
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }

  // Fetch rates for both currencies (unless USD which is always 1)
  const [fromRates, toRates] = await Promise.all([
    fromCurrency === "USD"
      ? Promise.resolve([])
      : exchangeRates.query({ currency: fromCurrency }, { between: [{ date: after }, { date: currentMonth }] }).all(),
    toCurrency === "USD"
      ? Promise.resolve([])
      : exchangeRates.query({ currency: toCurrency }, { between: [{ date: after }, { date: currentMonth }] }).all(),
  ]);

  // Build rate maps (only monthly rates - filter out daily format yyyy-mm-dd)
  const fromRateMap = new Map<string, number>();
  const toRateMap = new Map<string, number>();

  for (const r of fromRates) {
    // Only include monthly rates (yyyy-mm format, not yyyy-mm-dd)
    if (r.date.length === 7) {
      fromRateMap.set(r.date, r.rate);
    }
  }
  for (const r of toRates) {
    if (r.date.length === 7) {
      toRateMap.set(r.date, r.rate);
    }
  }

  // Find oldest available rate for backfilling
  const getOldestRate = (rateMap: Map<string, number>): number | undefined => {
    const sortedDates = [...rateMap.keys()].sort();
    const oldestDate = sortedDates[0];
    return oldestDate !== undefined ? rateMap.get(oldestDate) : undefined;
  };

  const oldestFromRate = fromCurrency === "USD" ? 1 : getOldestRate(fromRateMap);
  const oldestToRate = toCurrency === "USD" ? 1 : getOldestRate(toRateMap);

  // Calculate cross-rates for each month
  const rates: Record<string, number> = {};

  for (const m of months) {
    const fromRate = fromCurrency === "USD" ? 1 : fromRateMap.get(m) ?? oldestFromRate;
    const toRate = toCurrency === "USD" ? 1 : toRateMap.get(m) ?? oldestToRate;

    if (fromRate !== undefined && toRate !== undefined && fromRate !== 0) {
      // Cross-rate: toRate / fromRate
      // e.g., GBP→EUR = EUR_rate / GBP_rate (both are relative to USD)
      rates[m] = toRate / fromRate;
    }
  }

  return res.ok({ rates });
});
