import { updateExchangeRates } from "./exchangeRates";

type JobEvent = { job: string };

export const handler = async (event: JobEvent) => {
  console.log("Job received:", event.job);

  switch (event.job) {
    case "exchange-rate":
      await updateExchangeRates();
      break;
    default:
      throw new Error(`Unknown job: ${event.job}`);
  }

  console.log("Job completed:", event.job);
};
