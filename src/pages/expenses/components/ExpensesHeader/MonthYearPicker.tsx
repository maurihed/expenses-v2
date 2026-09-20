import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
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

function MonthYearPicker({ inverted = false }: { inverted?: boolean }) {
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

  const buttonTone = inverted
    ? "text-white hover:bg-white/15 hover:text-white"
    : "text-foreground";

  return (
    <div className="pt-2">
      <span className={cn(inverted ? "text-white/80" : "text-muted-foreground")}>{year}</span>
      <div className="flex items-center justify-center gap-1">
        <Button variant="ghost" className={buttonTone} aria-label="Mes anterior" onClick={() => handleArrowClick(-1)}>
          <MoveLeft />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn("min-w-32 text-2xl font-display font-semibold", buttonTone)}
          >
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
        <Button variant="ghost" className={buttonTone} aria-label="Mes siguiente" onClick={() => handleArrowClick(1)}>
          <MoveRight />
        </Button>
      </div>
    </div>
  );
}

export default MonthYearPicker;
