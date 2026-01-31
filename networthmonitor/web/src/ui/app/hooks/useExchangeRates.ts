import { useEffect, useState } from "preact/hooks";
import { getExchangeRates } from "../api";
import type { ExchangeRateMap } from "../utils/currencyConversion";

type UseExchangeRatesResult = {
  rates: ExchangeRateMap | null;
  isLoading: boolean;
  error: string | null;
};

/**
 * Hook to fetch exchange rates for multiple currencies to a target currency
 * @param currencies - Array of source currencies to fetch rates for
 * @param targetCurrency - The target currency to convert to
 * @param earliestMonth - The earliest month to fetch rates from (YYYY-MM format)
 */
export function useExchangeRates(
  currencies: string[],
  targetCurrency: string,
  earliestMonth: string | null
): UseExchangeRatesResult {
  const [rates, setRates] = useState<ExchangeRateMap | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Filter out target currency - no conversion needed
    const currenciesToFetch = currencies.filter((c) => c !== targetCurrency);

    // No currencies to fetch
    if (currenciesToFetch.length === 0) {
      setRates({});
      setIsLoading(false);
      return;
    }

    // No data yet
    if (!earliestMonth) {
      setRates({});
      setIsLoading(false);
      return;
    }

    const fetchRates = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const ratePromises = currenciesToFetch.map(async (currency) => {
          const response = await getExchangeRates(currency, targetCurrency, earliestMonth);
          // Response is { rates: Record<month, rate> }
          return { currency, rateMap: response.rates };
        });

        const results = await Promise.all(ratePromises);

        const ratesByMonth: ExchangeRateMap = {};
        for (const { currency, rateMap } of results) {
          ratesByMonth[currency] = rateMap;
        }

        // Cache is handled by getExchangeRates read-through cache
        setRates(ratesByMonth);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch exchange rates");
        setRates({});
      } finally {
        setIsLoading(false);
      }
    };

    fetchRates();
  }, [currencies.join(","), targetCurrency, earliestMonth]);

  return { rates, isLoading, error };
}
