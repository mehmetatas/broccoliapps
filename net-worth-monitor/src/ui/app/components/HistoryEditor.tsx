import { useEffect, useRef } from "preact/hooks";
import type { UpdateFrequency } from "../../../db/accounts";
import { MoneyInput } from "./MoneyInput";

type HistoryEditorProps = {
  history: Record<string, number | undefined>;
  onChange: (month: string, value: number | undefined) => void;
  onBlur?: (month: string) => void;
  currency?: string;
  savingMonths?: Record<string, boolean>;
  savedMonths?: Record<string, boolean>;
  disabled?: boolean;
  updateFrequency?: UpdateFrequency;
};

const shouldShowMonth = (monthStr: string, frequency?: UpdateFrequency): boolean => {
  if (!frequency || frequency === "monthly") return true;

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

const formatMonth = (key: string): string => {
  const parts = key.split("-");
  const year = parts[0] ?? "2000";
  const month = parts[1] ?? "01";
  const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1);
  const monthStr = date.toLocaleDateString("en-US", { month: "short" });
  return `${year} ${monthStr}`;
};

const getCurrentMonth = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const getPreviousMonth = (monthStr: string): string => {
  const parts = monthStr.split("-");
  const year = parseInt(parts[0] ?? "2000", 10);
  const month = parseInt(parts[1] ?? "01", 10);
  const date = new Date(year, month - 2);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const generateMonthRange = (startMonth: string, endMonth: string): string[] => {
  const months: string[] = [];
  let current = endMonth;
  while (current >= startMonth) {
    months.push(current);
    current = getPreviousMonth(current);
  }
  return months;
};

const getMinMonthsBack = (frequency?: UpdateFrequency): number => {
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

const getDisplayMonths = (
  history: Record<string, number | undefined>,
  currentMonth: string,
  updateFrequency?: UpdateFrequency
): string[] => {
  const enteredMonths = Object.entries(history)
    .filter(([_, value]) => value !== undefined)
    .map(([month]) => month)
    .sort();

  const earliestEntered = enteredMonths[0];
  const minMonthsBack = getMinMonthsBack(updateFrequency);

  // Calculate start month: go back at least minMonthsBack from the earliest entered or current month
  let startMonth = earliestEntered || currentMonth;
  for (let i = 0; i < minMonthsBack; i++) {
    startMonth = getPreviousMonth(startMonth);
  }

  return generateMonthRange(startMonth, currentMonth);
};

export const HistoryEditor = ({
  history,
  onChange,
  onBlur,
  currency,
  savingMonths = {},
  savedMonths = {},
  disabled,
  updateFrequency,
}: HistoryEditorProps) => {
  const currentMonth = getCurrentMonth();
  const allMonths = getDisplayMonths(history, currentMonth, updateFrequency);
  // Filter by frequency, but always include months that have existing values
  const sortedMonths = allMonths.filter(
    (month) => history[month] !== undefined || shouldShowMonth(month, updateFrequency)
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const prevMonthCountRef = useRef(sortedMonths.length);

  useEffect(() => {
    if (sortedMonths.length > prevMonthCountRef.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
    prevMonthCountRef.current = sortedMonths.length;
  }, [sortedMonths.length]);

  const getMonthStatus = (month: string): "saving" | "saved" | undefined => {
    if (savingMonths[month]) return "saving";
    if (savedMonths[month]) return "saved";
    return undefined;
  };

  const handleKeyDown = (e: KeyboardEvent, index: number) => {
    if (e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault();
      const inputs = containerRef.current?.querySelectorAll("input");
      if (inputs && index < inputs.length - 1) {
        (inputs[index + 1] as HTMLInputElement).focus();
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const inputs = containerRef.current?.querySelectorAll("input");
      if (inputs && index > 0) {
        (inputs[index - 1] as HTMLInputElement).focus();
      }
    }
  };

  return (
    <div
      ref={containerRef}
      class={`bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 max-h-64 min-h-48 overflow-y-auto ${disabled ? "opacity-60" : ""}`}
    >
      <div class="space-y-3">
        {sortedMonths.map((month, index) => (
          <MoneyInput
            key={month}
            value={history[month]}
            onChange={(value) => onChange(month, value)}
            onBlur={onBlur ? () => onBlur(month) : undefined}
            onKeyDown={(e) => handleKeyDown(e, index)}
            status={getMonthStatus(month)}
            placeholder="Not set"
            prefix={formatMonth(month)}
            currency={currency}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
};
