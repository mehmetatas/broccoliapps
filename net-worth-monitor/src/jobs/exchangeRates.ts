import { CurrencyRate, currencyRates } from "../db/currencyRates";

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

  // Check idempotency - skip if rates for this date already exist
  const existingRate = await currencyRates.get({ date: dateStr, currency: "USD" });
  if (existingRate) {
    console.log(`Rates for ${dateStr} already exist, skipping`);
    return;
  }

  // Store all daily rates
  const dailyRates: CurrencyRate[] = Object.entries(data.rates).map(([currency, rate]) => ({
    date: dateStr,
    currency,
    rate,
  }));

  await currencyRates.batchPut(dailyRates);
  console.log(`Stored ${dailyRates.length} exchange rates for ${dateStr}`);

  // Update running monthly average
  await updateMonthlyAverage(monthStr);

  // When a new month starts, delete previous month's daily data
  const dayOfMonth = updateDate.getUTCDate();
  if (dayOfMonth === 1) {
    await deletePreviousMonthDailyRates(year, parseInt(month));
  }
}

async function updateMonthlyAverage(monthStr: string): Promise<void> {
  const monthPrefix = `${monthStr}-`;

  // Query all daily rates for the current month
  const dailyRates = await currencyRates.query({ date: { beginsWith: monthPrefix } }).all();
  if (dailyRates.length === 0) {
    console.log(`No daily rates found for ${monthStr}`);
    return;
  }

  // Group rates by currency and calculate averages
  const ratesByCurrency: Record<string, number[]> = {};
  for (const rate of dailyRates) {
    if (!ratesByCurrency[rate.currency]) {
      ratesByCurrency[rate.currency] = [];
    }
    ratesByCurrency[rate.currency]!.push(rate.rate);
  }

  // Create/update monthly average records
  const monthlyAverages: CurrencyRate[] = Object.entries(ratesByCurrency).map(
    ([currency, rates]) => ({
      date: monthStr,
      currency,
      rate: rates.reduce((sum, r) => sum + r, 0) / rates.length,
    })
  );

  await currencyRates.batchPut(monthlyAverages);
  console.log(`Updated monthly average for ${monthStr} (${Object.keys(ratesByCurrency).length} currencies, based on ${dailyRates.length / Object.keys(ratesByCurrency).length} days)`);
}

async function deletePreviousMonthDailyRates(currentYear: number, currentMonth: number): Promise<void> {
  // Calculate previous month
  let prevYear = currentYear;
  let prevMonth = currentMonth - 1;
  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear--;
  }

  const prevMonthPrefix = `${prevYear}-${String(prevMonth).padStart(2, "0")}-`;

  // Query all daily rates for the previous month
  const dailyRates = await currencyRates.query({ date: { beginsWith: prevMonthPrefix } }).all();
  if (dailyRates.length === 0) {
    return;
  }

  await currencyRates.batchDelete(dailyRates);
  console.log(`Deleted ${dailyRates.length} daily rates for previous month`);
}
