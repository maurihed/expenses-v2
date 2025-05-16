import { ExpenseSection } from "@/components/ui/expense-section";
import { useDarkTheme } from "@/hooks/useDarkTheme";
import { getCategoryInfo } from "@/lib/CategoryUtils";
import { CategoryScale } from "chart.js";
import Chart from "chart.js/auto";
import { useMemo } from "react";
import { Doughnut } from "react-chartjs-2";
import { useTransactions } from "../hooks/useTransactions";

Chart.register(CategoryScale);

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
          backgroundColor: labels.map((category) => getCategoryInfo(category).rawColor),
          borderWidth: 0,
        },
      ],
    }),
    [labels, entries]
  );

  const textColor = isDarkTheme ? "#fafafa" : "#0a0a0a";

  if (!transactions.length) return "No hay transacciones";

  return (
    <ExpenseSection>
      <div className="flex justify-center">
        <div className="w-full max-w-3xl">
          <Doughnut
            data={chartData}
            options={{
              color: textColor,
              plugins: {
                legend: {
                  labels: {
                    font: {
                      size: 14,
                      family: "Moderustic",
                    },
                  },
                },
              },
            }}
          />
        </div>
      </div>
    </ExpenseSection>
  );
}
