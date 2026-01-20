import type { ChartArea, ScriptableContext } from "chart.js";
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
import { Line } from "react-chartjs-2";
import { getCurrencySymbol } from "../currency";

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

const formatMonthLabel = (key: string): string => {
  const parts = key.split("-");
  const year = parts[0] ?? "2000";
  const month = parts[1] ?? "01";
  const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
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
  // Filter to only entries with defined values and sort by date
  const entries = Object.entries(data)
    .filter((entry): entry is [string, number] => entry[1] !== undefined)
    .sort(([a], [b]) => a.localeCompare(b));

  // No data points - show empty state with subtle chart background
  if (entries.length === 0) {
    return (
      <div class="h-64 mb-6 bg-white dark:bg-black rounded-lg p-3 flex items-center justify-center relative overflow-hidden">
        <svg
          class="absolute inset-0 w-full h-full opacity-[0.07] dark:opacity-[0.1]"
          viewBox="0 0 400 200"
          preserveAspectRatio="none"
        >
          <path
            d="M0,150 Q50,140 80,120 T160,100 T240,80 T320,90 T400,60"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
            class="text-neutral-400"
          />
          <path
            d="M0,150 Q50,140 80,120 T160,100 T240,80 T320,90 T400,60 L400,200 L0,200 Z"
            fill="currentColor"
            class="text-neutral-400"
          />
        </svg>
        <span class="text-4xl font-bold text-neutral-200 dark:text-neutral-700 select-none relative z-10">
          No data
        </span>
      </div>
    );
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
        enabled: true,
        callbacks: {
          label: (context: { parsed: { y: number | null } }) => {
            const value = context.parsed.y;
            return value != null ? currencySymbol + value.toLocaleString() : "";
          },
        },
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
    <div class="h-64 mb-6 bg-white dark:bg-black rounded-lg p-3">
      <Line data={chartData} options={options} />
    </div>
  );
};
