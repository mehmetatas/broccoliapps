import { ValueChart } from "./ValueChart";

type ValueChartFilledProps = {
  data: Record<string, number | undefined>;
  variant?: "default" | "negative";
  currency?: string;
};

const fillToCurrentMonth = (
  data: Record<string, number | undefined>
): Record<string, number | undefined> => {
  // Get entries with defined values
  const entries = Object.entries(data).filter(
    (entry): entry is [string, number] => entry[1] !== undefined
  );

  if (entries.length === 0) {
    return data;
  }

  // Find earliest month from data
  const sortedMonths = entries.map(([m]) => m).sort((a, b) => a.localeCompare(b));
  const earliestMonth = sortedMonths[0]!;

  // Get current month
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Generate all months from earliest to current
  const allMonths: string[] = [];
  let iterMonth = earliestMonth;
  while (iterMonth <= currentMonth) {
    allMonths.push(iterMonth);
    const [year, month] = iterMonth.split("-").map(Number);
    const nextDate = new Date(year!, month!); // month is 1-based, Date expects 0-based so this gives next month
    iterMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`;
  }

  // Build filled data with carry-forward
  const filled: Record<string, number | undefined> = {};
  let lastKnownValue: number | undefined;

  for (const month of allMonths) {
    if (data[month] !== undefined) {
      lastKnownValue = data[month];
    }
    filled[month] = lastKnownValue;
  }

  return filled;
};

export const ValueChartFilled = ({ data, variant = "default", currency }: ValueChartFilledProps) => {
  const filledData = fillToCurrentMonth(data);
  return <ValueChart data={filledData} variant={variant} currency={currency} />;
};
