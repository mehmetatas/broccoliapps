import { table } from "@broccoliapps/backend/dist/db/table";

export type CurrencyRate = {
  date: string;      // "yyyy-mm-dd" for daily, "yyyy-mm" for monthly
  currency: string;  // "USD", "EUR", etc.
  rate: number;      // Rate relative to USD
};

export const currencyRates = table<CurrencyRate>("currencyRate")
  .key([], ["date", "currency"])
  .build();
