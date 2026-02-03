import { getExchangeRates as getExchangeRatesApi } from "../api-contracts";
import { CACHE_KEYS } from "./cache";
import { getCache } from "./init";

type ExchangeRatesResponse = Awaited<ReturnType<typeof getExchangeRatesApi.invoke>>;
type ExchangeRateMap = Record<string, Record<string, number>>;

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// Read-through cache: check cache → call API if miss → merge into cache → return
// Uses 1 day TTL
export const getExchangeRates = async (fromCurrency: string, toCurrency: string, after: string): Promise<ExchangeRatesResponse> => {
  const cached = getCache().get<ExchangeRateMap>(CACHE_KEYS.exchangeRates);
  if (cached?.[fromCurrency]) {
    return { rates: cached[fromCurrency] };
  }

  const response = await getExchangeRatesApi.invoke({ fromCurrency, toCurrency, after });

  const existing = getCache().get<ExchangeRateMap>(CACHE_KEYS.exchangeRates) ?? {};
  const updated = { ...existing, [fromCurrency]: response.rates };
  const expiresAt = Date.now() + ONE_DAY_MS;
  getCache().set(CACHE_KEYS.exchangeRates, updated, expiresAt);

  return response;
};

// Sync read for components (MoneyDisplay)
export const getAggregatedRates = (): ExchangeRateMap | undefined => {
  return getCache().get<ExchangeRateMap>(CACHE_KEYS.exchangeRates) ?? undefined;
};
