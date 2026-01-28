import { cache } from "@broccoliapps/browser";
import { getExchangeRates as getExchangeRatesApi } from "../../../shared/api-contracts";
import type { ExchangeRateMap } from "../utils/currencyConversion";
import { CACHE_KEYS } from "./cache";

type ExchangeRatesResponse = Awaited<ReturnType<typeof getExchangeRatesApi.invoke>>;

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// Read-through cache: check cache → call API if miss → merge into cache → return
// Uses localStorage (default) with 1 day TTL
export const getExchangeRates = async (
  fromCurrency: string,
  toCurrency: string,
  after: string
): Promise<ExchangeRatesResponse> => {
  // Check if this currency's rates are already cached
  const cached = cache.get<ExchangeRateMap>(CACHE_KEYS.exchangeRates);
  if (cached?.[fromCurrency]) {
    return { rates: cached[fromCurrency] };
  }

  // Cache miss - fetch from API
  const response = await getExchangeRatesApi.invoke({ fromCurrency, toCurrency, after });

  // Merge into existing cache
  const existing = cache.get<ExchangeRateMap>(CACHE_KEYS.exchangeRates) ?? {};
  const updated = { ...existing, [fromCurrency]: response.rates };
  const expiresAt = Date.now() + ONE_DAY_MS;
  cache.set(CACHE_KEYS.exchangeRates, updated, expiresAt);

  return response;
};

// Sync read for components (MoneyDisplay)
export const getAggregatedRates = (): ExchangeRateMap | undefined => {
  return cache.get<ExchangeRateMap>(CACHE_KEYS.exchangeRates) ?? undefined;
};
