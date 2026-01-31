import type { ChartArea, ScriptableContext, TooltipModel } from "chart.js";
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { useRef } from "preact/hooks";
import { render } from "preact";
import { Line } from "react-chartjs-2";
import { getCurrencySymbol } from "../../../shared/currency";
import { formatMonthLabel } from "../utils/dateUtils";
import { fillToCurrentMonth } from "../utils/historyUtils";
import { EmptyState } from "@broccoliapps/browser";
import { MoneyDisplay } from "./MoneyDisplay";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

type ValueChartProps = {
  data: Record<string, number | undefined>;
  variant?: "default" | "negative";
  currency?: string;
};

const formatCompactNumber = (value: number, currencySymbol: string): string => {
  const absValue = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (absValue >= 1_000_000_000) {
    return sign + currencySymbol + (absValue / 1_000_000_000).toFixed(absValue % 1_000_000_000 === 0 ? 0 : 1) + "B";
  }
  if (absValue >= 1_000_000) {
    return sign + currencySymbol + (absValue / 1_000_000).toFixed(absValue % 1_000_000 === 0 ? 0 : 1) + "M";
  }
  if (absValue >= 1_000) {
    return sign + currencySymbol + (absValue / 1_000).toFixed(absValue % 1_000 === 0 ? 0 : 1) + "K";
  }
  return sign + currencySymbol + absValue;
};

const createGradient = (
  ctx: CanvasRenderingContext2D,
  chartArea: ChartArea,
  isDark: boolean,
  isNegative: boolean
) => {
  const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
  if (isNegative) {
    // Red gradient for negative values
    if (isDark) {
      gradient.addColorStop(0, "rgba(239, 68, 68, 0.4)");
      gradient.addColorStop(1, "rgba(239, 68, 68, 0)");
    } else {
      gradient.addColorStop(0, "rgba(239, 68, 68, 0.3)");
      gradient.addColorStop(1, "rgba(239, 68, 68, 0)");
    }
  } else {
    // Blue gradient for positive values
    if (isDark) {
      gradient.addColorStop(0, "rgba(59, 130, 246, 0.4)");
      gradient.addColorStop(1, "rgba(59, 130, 246, 0)");
    } else {
      gradient.addColorStop(0, "rgba(59, 130, 246, 0.3)");
      gradient.addColorStop(1, "rgba(59, 130, 246, 0)");
    }
  }
  return gradient;
};

export const ValueChart = ({ data, variant = "default", currency = "USD" }: ValueChartProps) => {
  const currencySymbol = getCurrencySymbol(currency);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // External tooltip handler
  const externalTooltipHandler = (context: { chart: ChartJS; tooltip: TooltipModel<"line"> }) => {
    const { chart, tooltip } = context;
    const tooltipEl = tooltipRef.current;
    if (!tooltipEl) return;

    // Hide if no tooltip
    if (tooltip.opacity === 0) {
      tooltipEl.style.opacity = "0";
      return;
    }

    // Get data point
    const dataPoint = tooltip.dataPoints?.[0];
    if (!dataPoint) {
      tooltipEl.style.opacity = "0";
      return;
    }

    const value = dataPoint.parsed.y;
    const label = dataPoint.label;

    if (value === null) {
      tooltipEl.style.opacity = "0";
      return;
    }

    // Render MoneyDisplay into tooltip
    render(
      <div class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg px-3 py-2">
        <div class="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{label}</div>
        <MoneyDisplay amount={value} currency={currency} size="sm" />
      </div>,
      tooltipEl
    );

    // Position tooltip
    const position = chart.canvas.getBoundingClientRect();
    tooltipEl.style.opacity = "1";
    tooltipEl.style.left = position.left + window.scrollX + tooltip.caretX + "px";
    tooltipEl.style.top = position.top + window.scrollY + tooltip.caretY - 10 + "px";
    tooltipEl.style.transform = "translate(-50%, -100%)";
  };

  // Fill gaps to current month, then filter to only entries with defined values and sort by date
  const filledData = fillToCurrentMonth(data);
  const entries = Object.entries(filledData)
    .filter((entry): entry is [string, number] => entry[1] !== undefined)
    .sort(([a], [b]) => a.localeCompare(b));

  // No data points - show empty state with subtle chart background
  if (entries.length === 0) {
    return <EmptyState title="No data" />;
  }

  let labels: string[];
  let values: number[];

  if (entries.length === 1) {
    // Single data point: show chart from "Start" at 0 to current value
    const [month, value] = entries[0]!;
    labels = ["Start", formatMonthLabel(month)];
    values = [0, value];
  } else {
    labels = entries.map(([month]) => formatMonthLabel(month));
    values = entries.map(([, value]) => value);
  }

  // Detect dark mode
  const isDark =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  const isNegative = variant === "negative";
  const lineColor = isNegative ? "#ef4444" : "#3b82f6";
  const fallbackBg = isNegative ? "rgba(239, 68, 68, 0.1)" : "rgba(59, 130, 246, 0.1)";

  const chartData = {
    labels,
    datasets: [
      {
        data: values,
        borderColor: lineColor,
        backgroundColor: (context: ScriptableContext<"line">) => {
          const { ctx, chartArea } = context.chart;
          if (!chartArea) {
            return fallbackBg;
          }
          return createGradient(ctx, chartArea, isDark, isNegative);
        },
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: lineColor,
        pointHoverBorderColor: isDark ? "#000" : "#fff",
        pointHoverBorderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: false,
        external: externalTooltipHandler,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: isDark ? "#94a3b8" : "#64748b",
          maxTicksLimit: 10,
        },
      },
      y: {
        grid: { display: false },
        ticks: {
          color: isDark ? "#94a3b8" : "#64748b",
          maxTicksLimit: 4,
          callback: (value: string | number) => formatCompactNumber(Number(value), currencySymbol),
        },
      },
    },
  };

  return (
    <div class="relative h-64 p-2 bg-white dark:bg-black rounded-lg">
      <Line data={chartData} options={options} />
      <div
        ref={tooltipRef}
        class="fixed pointer-events-none z-50 transition-opacity duration-150"
        style={{ opacity: 0 }}
      />
    </div>
  );
};
