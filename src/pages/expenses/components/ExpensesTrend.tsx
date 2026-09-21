import { useDarkTheme } from "@/hooks/useDarkTheme";
import { getMonthName } from "@/lib/DateUtils";
import type { ChartData, ChartOptions } from "chart.js";
import { useMemo } from "react";
import { Line } from "react-chartjs-2";
import { useTransactions } from "../hooks/useTransactions";

export default function ExpensesTrend() {
  const { transactions } = useTransactions(false);
  const isDarkTheme = useDarkTheme();

  const data: Record<string, number> = useMemo(() => {
    const temporal: Record<string, number> = {};
    transactions
      .filter((t) => t.type === "expense")
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .forEach((transaction) => {
        const key = `${transaction.date.getDate()} ${getMonthName(transaction.date.getMonth())}`;
        if (key in temporal) {
          temporal[key] += transaction.amount;
        } else {
          temporal[key] = transaction.amount;
        }
      });
    return temporal;
  }, [transactions]);

  const chartData: ChartData<"line"> = useMemo(
    () => ({
      labels: Object.keys(data),
      datasets: [
        {
          label: "Gasto",
          data: Object.values(data),
          tension: 0.4,
          fill: true,
          radius: 3,
          borderWidth: 3,
          backgroundColor: "rgba(99, 102, 241, 0.18)",
          borderColor: "#6366f1",
          pointBorderColor: "#6366f1",
          pointBackgroundColor: "#a5b4fc",
          pointBorderWidth: 2,
        },
      ],
    }),
    [data]
  );

  const textColor = isDarkTheme ? "#f4f4f7" : "#0b0b12";

  const chartOptions: ChartOptions<"line"> = useMemo(
    () => ({
      scales: {
        y: {
          type: "logarithmic",
          grid: { color: isDarkTheme ? "rgba(255,255,255,0.06)" : "rgba(2,6,23,0.06)" },
          ticks: {
            color: textColor,
            font: { size: 12, family: "Outfit" },
            callback: (value) => `$${value}`,
          },
        },
        x: {
          grid: { display: false },
          ticks: { color: textColor, font: { size: 12, family: "Outfit" } },
        },
      },
      color: textColor,
      responsive: true,
      plugins: {
        legend: { display: false },
      },
    }),
    [textColor, isDarkTheme]
  );

  if (!transactions.length) return "No hay transacciones";
  return (
    <div className="chart-container">
      <Line data={chartData} options={chartOptions} />
    </div>
  );
}
