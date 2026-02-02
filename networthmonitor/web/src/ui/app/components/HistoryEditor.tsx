import { useEffect, useRef } from "preact/hooks";
import type { UpdateFrequency } from "@broccoliapps/nwm-shared";
import {
  formatMonth,
  generateMonthRange,
  getCurrentMonth,
  getMinMonthsBack,
  getPreviousMonth,
  shouldShowMonth,
} from "../utils/dateUtils";
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
    if (savingMonths[month]) {
      return "saving";
    }
    if (savedMonths[month]) {
      return "saved";
    }
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
