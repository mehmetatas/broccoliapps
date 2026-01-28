import type { UpdateFrequency } from "../../db/accounts";

export const calculateNextUpdate = (
  history: Record<string, number>,
  updateFrequency: UpdateFrequency
): string => {
  const months = Object.keys(history);
  if (months.length === 0) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }

  const latestMonth = months.sort((a, b) => b.localeCompare(a))[0]!;
  const intervalMonths = { monthly: 1, quarterly: 3, biannually: 6, yearly: 12 }[updateFrequency];

  const [year, month] = latestMonth.split("-").map(Number) as [number, number];
  const date = new Date(year, month - 1 + intervalMonths);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};
