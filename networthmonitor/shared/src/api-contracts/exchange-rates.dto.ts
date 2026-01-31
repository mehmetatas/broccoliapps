import * as v from "valibot";

export const getExchangeRatesRequest = {
  fromCurrency: v.pipe(v.string(), v.minLength(3), v.maxLength(3)),
  toCurrency: v.pipe(v.string(), v.minLength(3), v.maxLength(3)),
  after: v.pipe(v.string(), v.regex(/^\d{4}-\d{2}$/), v.minValue("1990-01")),
};
export type GetExchangeRatesRequest = v.InferOutput<v.ObjectSchema<typeof getExchangeRatesRequest, undefined>>;

export const getExchangeRatesResponse = {
  rates: v.record(v.string(), v.number()),
};
export type GetExchangeRatesResponse = v.InferOutput<v.ObjectSchema<typeof getExchangeRatesResponse, undefined>>;
