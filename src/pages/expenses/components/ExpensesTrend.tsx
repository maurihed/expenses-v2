import { getMonthName } from "@/lib/DateUtils";
import type { ChartData, ChartOptions } from "chart.js";
import { useMemo } from "react";
import { Line } from "react-chartjs-2";
import { useTransactions } from "../hooks/useTransactions";

export default function ExpensesTrend() {
  const { transactions } = useTransactions(false);

  const data: Record<string, number> = useMemo(() => {
    const temporal: Record<string, number> = {};
    transactions
      .filter((t) => t.type === "expense")
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .forEach((transaction) => {
        const key = `${transaction.date.getDate()} ${getMonthName(
          transaction.date.getMonth()
        )}`;
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
          tension: 0.5,
          fill: true,
          radius: 3,
          backgroundColor: "rgb(167, 139, 250)",
          borderColor: "rgb(139, 92, 246)",
          pointBorderColor: "rgb(139, 92, 246)",
          pointBackgroundColor: "rgb(167, 139, 250)",
          pointBorderWidth: 2,
        },
      ],
    }),
    [data]
  );

  const chartOptions: ChartOptions<"line"> = useMemo(
    () => ({
      // animations: {
      //   tension: {
      //     duration: 1000,
      //     easing: 'linear',
      //     from: 1,
      //     to: 0,
      //     loop: true
      //   }
      // },
      scales: {
        y: {
          type: "logarithmic",
          ticks: {
            color: "#fff",
            font: {
              size: 14,
              family: "Moderustic",
            },
            callback: (value) => `$${value}`,
          },
        },
        x: {
          ticks: {
            color: "#fff",
            font: {
              size: 14,
              family: "Moderustic",
            },
          },
        },
      },
      color: "#FFF",
      responsive: true,
      plugins: {
        legend: {
          display: false,
          labels: {
            font: {
              size: 16,
              family: "Moderustic",
            },
          },
        },
      },
    }),
    []
  );
  if (!transactions.length) return "No hay transacciones";
  return (
    <div className="chart-container">
      <Line data={chartData} options={chartOptions} />
    </div>
  );
}
