import { ChevronLeft, ChevronRight } from "lucide-preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { useClickOutside } from "../hooks/useClickOutside";
import { useFlipPosition } from "../hooks/useFlipPosition";

type DatePickerProps = {
  value?: string; // YYYY-MM-DD
  onChange: (value: string | undefined) => void;
  isOpen: boolean;
  onClose: () => void;
  align?: "left" | "right";
};

const DAYS_OF_WEEK = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const toYMD = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const parseYMD = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
};

const getCalendarDays = (year: number, month: number) => {
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7; // Monday=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: { day: number; inMonth: boolean; date: string }[] = [];

  // Previous month padding
  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const dt = new Date(year, month - 1, d);
    days.push({ day: d, inMonth: false, date: toYMD(dt) });
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(year, month, d);
    days.push({ day: d, inMonth: true, date: toYMD(dt) });
  }

  // Next month padding (fill to 42 = 6 rows)
  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    const dt = new Date(year, month + 1, d);
    days.push({ day: d, inMonth: false, date: toYMD(dt) });
  }

  return days;
};

export const DatePicker = ({ value, onChange, isOpen, onClose, align = "right" }: DatePickerProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const today = useMemo(() => toYMD(new Date()), []);

  const initial = value ? parseYMD(value) : new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  // Reset view when opening
  useEffect(() => {
    if (isOpen) {
      const d = value ? parseYMD(value) : new Date();
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [isOpen, value]);

  const flipped = useFlipPosition(ref, isOpen);

  useClickOutside(ref, onClose, isOpen);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const days = getCalendarDays(viewYear, viewMonth);
  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const selectDate = (date: string) => {
    onChange(date);
    onClose();
  };

  const goToday = () => {
    onChange(today);
    onClose();
  };

  const clearDate = () => {
    onChange(undefined);
    onClose();
  };

  return (
    <div
      ref={ref}
      class={`absolute ${flipped ? "bottom-full mb-1" : "mt-1"} w-64 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg z-50 p-3 ${
        align === "right" ? "right-0" : "left-0"
      }`}
    >
      {/* Header */}
      <div class="flex items-center justify-between mb-2">
        <button type="button" onClick={prevMonth} class="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400">
          <ChevronLeft size={16} />
        </button>
        <span class="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{monthLabel}</span>
        <button type="button" onClick={nextMonth} class="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day-of-week labels */}
      <div class="grid grid-cols-7 mb-1">
        {DAYS_OF_WEEK.map((d) => (
          <div key={d} class="text-center text-xs font-medium text-neutral-400 dark:text-neutral-500 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div class="grid grid-cols-7">
        {days.map((d, i) => {
          const isSelected = d.date === value;
          const isToday = d.date === today;
          return (
            <button
              key={i}
              type="button"
              onClick={() => selectDate(d.date)}
              class={`h-8 w-8 mx-auto text-sm rounded-full flex items-center justify-center ${
                isSelected
                  ? "bg-blue-500 text-white font-semibold"
                  : isToday
                    ? "ring-1 ring-blue-400 dark:ring-blue-500 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                    : d.inMonth
                      ? "text-neutral-900 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                      : "text-neutral-300 dark:text-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-750"
              }`}
            >
              {d.day}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div class="flex items-center justify-between mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-700">
        {value ? (
          <button type="button" onClick={clearDate} class="text-xs text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 font-medium">
            Clear
          </button>
        ) : (
          <span />
        )}
        <button type="button" onClick={goToday} class="text-xs text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 font-medium">
          Today
        </button>
      </div>
    </div>
  );
};
