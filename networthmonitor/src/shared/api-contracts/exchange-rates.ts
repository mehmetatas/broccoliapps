import { api } from "@broccoliapps/shared";
import { getExchangeRatesRequest, getExchangeRatesResponse } from "./exchange-rates.dto";

export const getExchangeRates = api("GET", "/exchange-rates/:fromCurrency/:toCurrency")
  .withRequest(getExchangeRatesRequest)
  .withResponse(getExchangeRatesResponse);
