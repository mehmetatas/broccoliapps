import { ExchangeRate, exchangeRates } from "../db/currencyRates";

type ExchangeRateApiResponse = {
  result: string;
  time_last_update_unix: number;
  rates: Record<string, number>;
};

export async function updateExchangeRates(): Promise<void> {
  // Fetch exchange rates from API
  const response = await fetch("https://open.er-api.com/v6/latest/USD");
  if (!response.ok) {
    throw new Error(`Failed to fetch exchange rates: ${response.statusText}`);
  }

  const data: ExchangeRateApiResponse = await response.json();
  if (data.result !== "success") {
    throw new Error("Exchange rate API returned non-success result");
  }

  // Extract date from API response
  const updateDate = new Date(data.time_last_update_unix * 1000);
  const year = updateDate.getUTCFullYear();
  const month = String(updateDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(updateDate.getUTCDate()).padStart(2, "0");
  const dateStr = `${year}-${month}-${day}`;
  const monthStr = `${year}-${month}`;

  const currencies = Object.keys(data.rates).filter((c) => c !== "USD");

  // Check idempotency - skip if rates for this date already exist
  const existingRate = await exchangeRates.get({ currency: "GBP" }, { date: dateStr });
  if (existingRate) {
    console.log(`Rates for ${dateStr} already exist, skipping`);
    return;
  }

  // Store all daily rates
  const dailyRates: ExchangeRate[] = currencies.map((currency) => ({
    date: dateStr,
    currency,
    rate: data.rates[currency]!,
  }));

  await exchangeRates.batchPut(dailyRates);
  console.log(`Stored ${dailyRates.length} exchange rates for ${dateStr}`);

  // Update running monthly average
  await updateMonthlyAverage(monthStr, currencies);

  // When a new month starts, delete previous month's daily data
  const dayOfMonth = updateDate.getUTCDate();
  if (dayOfMonth === 1) {
    await deletePreviousMonthDailyRates(year, parseInt(month), currencies);
  }
}

async function updateMonthlyAverage(monthStr: string, currencies: string[]): Promise<void> {
  const monthPrefix = `${monthStr}-`;

  // Query daily rates for each currency (new table has currency as PK)
  const allDailyRates: ExchangeRate[] = [];
  for (const currency of currencies) {
    const rates = await exchangeRates.query({ currency }, { date: { beginsWith: monthPrefix } }).all();
    allDailyRates.push(...rates);
  }

  if (allDailyRates.length === 0) {
    console.log(`No daily rates found for ${monthStr}`);
    return;
  }

  // Group rates by currency and calculate averages
  const ratesByCurrency: Record<string, number[]> = {};
  for (const rate of allDailyRates) {
    if (!ratesByCurrency[rate.currency]) {
      ratesByCurrency[rate.currency] = [];
    }
    ratesByCurrency[rate.currency]!.push(rate.rate);
  }

  // Create/update monthly average records
  const monthlyAverages: ExchangeRate[] = Object.entries(ratesByCurrency).map(([currency, rates]) => ({
    date: monthStr,
    currency,
    rate: rates.reduce((sum, r) => sum + r, 0) / rates.length,
  }));

  await exchangeRates.batchPut(monthlyAverages);
  console.log(
    `Updated monthly average for ${monthStr} (${Object.keys(ratesByCurrency).length} currencies, based on ${allDailyRates.length / Object.keys(ratesByCurrency).length} days)`,
  );
}

async function deletePreviousMonthDailyRates(currentYear: number, currentMonth: number, currencies: string[]): Promise<void> {
  // Calculate previous month
  let prevYear = currentYear;
  let prevMonth = currentMonth - 1;
  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear--;
  }

  const prevMonthPrefix = `${prevYear}-${String(prevMonth).padStart(2, "0")}-`;

  // Query daily rates for each currency (new table has currency as PK)
  const allDailyRates: ExchangeRate[] = [];
  for (const currency of currencies) {
    const rates = await exchangeRates.query({ currency }, { date: { beginsWith: prevMonthPrefix } }).all();
    allDailyRates.push(...rates);
  }

  if (allDailyRates.length === 0) {
    return;
  }

  // Delete using proper key structure
  await exchangeRates.batchDelete(allDailyRates.map((r) => ({ pk: { currency: r.currency }, sk: { date: r.date } })));
  console.log(`Deleted ${allDailyRates.length} daily rates for previous month`);
}
