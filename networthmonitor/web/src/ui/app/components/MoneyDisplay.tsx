import { preferences } from "@broccoliapps/browser";
import { getCurrencySymbol } from "@broccoliapps/nwm-shared";
import * as client from "../api";
import { convertValue } from "../utils/currencyConversion";
import { getCurrentMonth } from "../utils/dateUtils";

type MoneyDisplayProps = {
  amount: number;
  currency: string;
  convert?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  showSign?: boolean;
  toggler?: boolean;
  onToggle?: () => void;
};

const sizeClasses = {
  sm: {
    amount: "text-sm",
    currency: "text-xs",
  },
  md: {
    amount: "text-lg",
    currency: "text-xs",
  },
  lg: {
    amount: "text-2xl",
    currency: "text-sm",
  },
  xl: {
    amount: "text-4xl",
    currency: "text-lg",
  },
};

export const MoneyDisplay = ({ amount, currency, convert = false, size = "md", showSign = false, toggler = false, onToggle }: MoneyDisplayProps) => {
  const classes = sizeClasses[size];
  const targetCurrency = (preferences.getAllSync()?.targetCurrency as string) || "USD";
  const exchangeRates = client.getAggregatedRates();

  const canToggle = toggler && currency !== targetCurrency && exchangeRates;
  const shouldConvert = convert && currency !== targetCurrency && exchangeRates;

  let displayAmount = amount;
  let displayCurrency = currency;

  if (shouldConvert) {
    const currentMonth = getCurrentMonth();
    displayAmount = convertValue(amount, currency, currentMonth, exchangeRates, targetCurrency);
    displayCurrency = targetCurrency;
  }

  const roundedAmount = Math.round(displayAmount);
  const formattedAmount = Math.abs(roundedAmount).toLocaleString();
  const isNegative = roundedAmount < 0;
  const sign = showSign ? (isNegative ? "-" : "+") : isNegative ? "-" : "";

  const handleToggle = () => {
    if (canToggle && onToggle) {
      onToggle();
    }
  };

  const currencyClasses = canToggle
    ? "ml-1 font-normal text-neutral-500 dark:text-neutral-400 underline decoration-dashed underline-offset-4 cursor-pointer hover:text-neutral-700 dark:hover:text-neutral-300"
    : "ml-1 font-normal text-neutral-500 dark:text-neutral-400";

  return (
    <div>
      <span class={`font-semibold text-neutral-900 dark:text-neutral-100 ${classes.amount}`}>
        {sign}
        {getCurrencySymbol(displayCurrency)}
        {formattedAmount}
      </span>
      <span class={`${currencyClasses} ${classes.currency}`} onClick={handleToggle}>
        {displayCurrency}
      </span>
    </div>
  );
};
