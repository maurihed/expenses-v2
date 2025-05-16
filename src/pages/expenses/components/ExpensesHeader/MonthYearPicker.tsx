import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useExpensesStore } from "@/stores/expenses.store";
import { MoveLeft, MoveRight } from "lucide-react";

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function MonthYearPicker() {
  const { year, month } = useExpensesStore((state) => state.monthYear);
  const setMonthYear = useExpensesStore((state) => state.setMonthYear);

  const handleChange = (newMonth: number, newYear?: number) => {
    const newMonthYear = { month: newMonth, year: newYear ?? year };
    setMonthYear(newMonthYear);
  };

  const handleArrowClick = (increment: number) => {
    const newMonth = month + increment;
    if (newMonth < 0) {
      handleChange(11, year - 1);
    } else if (newMonth > 11) {
      handleChange(0, year + 1);
    } else {
      handleChange(newMonth);
    }
  };

  return (
    <div className="pt-2">
      <span className="text-slate-600 dark:text-slate-300">{year}</span>
      <div>
        <Button variant="ghost" onClick={() => handleArrowClick(-1)}>
          <MoveLeft />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger className="text-2xl min-w-32">
            {MONTHS[month]}
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup
              value={String(month)}
              onValueChange={(month) => setMonthYear({ year, month: Number(month) })}
            >
              {MONTHS.map((month, index) => (
                <DropdownMenuRadioItem key={month} value={String(index)}>
                  {month}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="ghost" onClick={() => handleArrowClick(1)}>
          <MoveRight />
        </Button>
      </div>
    </div>
  );
}

export default MonthYearPicker;
