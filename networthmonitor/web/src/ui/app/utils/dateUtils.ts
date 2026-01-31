import type { UpdateFrequency } from "@broccoliapps/nwm-shared";

/**
 * Get the current month in YYYY-MM format
 */
export const getCurrentMonth = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

/**
 * Get the previous month from a given month string
 */
export const getPreviousMonth = (monthStr: string): string => {
  const parts = monthStr.split("-");
  const year = parseInt(parts[0] ?? "2000", 10);
  const month = parseInt(parts[1] ?? "01", 10);
  const date = new Date(year, month - 2);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

/**
 * Get the next month from a given month string
 */
export const getNextMonth = (monthStr: string): string => {
  const [year, month] = monthStr.split("-").map(Number);
  const nextDate = new Date(year!, month!); // month is 1-based, Date expects 0-based so this gives next month
  return `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`;
};

/**
 * Generate an array of months between start and end (inclusive), in descending order
 */
export const generateMonthRange = (startMonth: string, endMonth: string): string[] => {
  const months: string[] = [];
  let current = endMonth;
  while (current >= startMonth) {
    months.push(current);
    current = getPreviousMonth(current);
  }
  return months;
};

/**
 * Generate an array of months between start and end (inclusive), in ascending order
 */
export const generateMonthRangeAscending = (startMonth: string, endMonth: string): string[] => {
  const months: string[] = [];
  let current = startMonth;
  while (current <= endMonth) {
    months.push(current);
    current = getNextMonth(current);
  }
  return months;
};

/**
 * Check if a month should be shown based on update frequency
 */
export const shouldShowMonth = (monthStr: string, frequency?: UpdateFrequency): boolean => {
  if (!frequency || frequency === "monthly") {return true;}

  const month = parseInt(monthStr.split("-")[1] ?? "01", 10);

  switch (frequency) {
    case "quarterly":
      return [1, 4, 7, 10].includes(month); // Jan, Apr, Jul, Oct
    case "biannually":
      return [1, 7].includes(month); // Jan, Jul
    case "yearly":
      return month === 1; // Jan only
    default:
      return true;
  }
};

/**
 * Format a YYYY-MM month string to "YYYY Mon" display format
 */
export const formatMonth = (key: string): string => {
  const parts = key.split("-");
  const year = parts[0] ?? "2000";
  const month = parts[1] ?? "01";
  const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1);
  const monthStr = date.toLocaleDateString("en-US", { month: "short" });
  return `${year} ${monthStr}`;
};

/**
 * Format a YYYY-MM month string to "Mon YYYY" display format (for charts)
 */
export const formatMonthLabel = (key: string): string => {
  const parts = key.split("-");
  const year = parts[0] ?? "2000";
  const month = parts[1] ?? "01";
  const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
};

/**
 * Get the minimum months back based on update frequency
 */
export const getMinMonthsBack = (frequency?: UpdateFrequency): number => {
  switch (frequency) {
    case "yearly":
      return 12;
    case "biannually":
      return 6;
    case "quarterly":
      return 3;
    default:
      return 1;
  }
};

/**
 * Check if an account has missed its update (nextUpdate <= current month)
 */
export const hasMissedUpdate = (nextUpdate?: string): boolean => {
  if (!nextUpdate) return false;
  const currentMonth = getCurrentMonth();
  return nextUpdate <= currentMonth;
};
