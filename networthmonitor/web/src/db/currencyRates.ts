import { table } from "@broccoliapps/backend/dist/db/table";

export type CurrencyRate = {
  date: string;      // "yyyy-mm-dd" for daily, "yyyy-mm" for monthly
  currency: string;  // "USD", "EUR", etc.
  rate: number;      // Rate relative to USD
};

export const currencyRates = table<CurrencyRate>("currencyRate")
  .key([], ["date", "currency"])
  .build();


// NEW FORMAT - same entity, different key structure

export type ExchangeRate = {
  currency: string;  // "USD", "EUR", etc.
  date: string;      // "yyyy-mm-dd" for daily, "yyyy-mm" for monthly
  rate: number;      // Rate relative to USD
};

export const exchangeRates = table<ExchangeRate>("exchangeRate")
  .key(["currency"], ["date"])
  .build();