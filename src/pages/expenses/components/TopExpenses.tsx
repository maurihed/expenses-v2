import { useDarkTheme } from "@/hooks/useDarkTheme";
import { CategoryScale } from "chart.js";
import Chart from "chart.js/auto";
import { useMemo } from "react";
import { Doughnut } from "react-chartjs-2";
import { useTransactions } from "../hooks/useTransactions";

Chart.register(CategoryScale);

const PALETTE = ["#6366f1", "#8b5cf6", "#10b981", "#f59e0b", "#0ea5e9"];

export default function TopExpenses() {
  const { transactions } = useTransactions(false);
  const isDarkTheme = useDarkTheme();

  const [labels, entries] = useMemo(() => {
    return Object.entries(
      transactions
        .filter((t) => t.type === "expense")
        .reduce((acc: Record<string, number>, curr) => {
          if (curr.category in acc) {
            acc[curr.category] = acc[curr.category] + curr.amount;
          } else {
            acc[curr.category] = curr.amount;
          }
          return acc;
        }, {})
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .reduce(
        (acc: [string[], number[]], [key, value]) => {
          acc[0].push(key);
          acc[1].push(value);
          return acc;
        },
        [[], []]
      );
  }, [transactions]);

  const chartData = useMemo(
    () => ({
      labels,
      datasets: [
        {
          data: entries,
          backgroundColor: labels.map((_, index) => PALETTE[index % PALETTE.length]),
          borderWidth: 0,
          spacing: 2,
          borderRadius: 8,
        },
      ],
    }),
    [labels, entries]
  );

  const textColor = isDarkTheme ? "#f4f4f7" : "#0b0b12";

  if (!transactions.length) return "No hay transacciones";

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-3xl">
        <Doughnut
          data={chartData}
          options={{
            color: textColor,
            cutout: "62%",
            plugins: {
              legend: {
                position: "bottom",
                labels: {
                  color: textColor,
                  usePointStyle: true,
                  pointStyle: "circle",
                  font: { size: 13, family: "Outfit" },
                },
              },
            },
          }}
        />
      </div>
    </div>
  );
}
