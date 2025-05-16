import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/components/ui/category-icon";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import { useState, type ChangeEvent } from "react";
import { useTransactions } from "../hooks/useTransactions";

type ExpensesFiltersProps = {
  search: string;
  onSearchChange: (search: string) => void;
  categories: Set<string>;
  onCategorySelected: (category: Set<string>) => void;
};

function ExpensesFilters({
  search,
  categories,
  onSearchChange,
  onCategorySelected,
}: ExpensesFiltersProps) {
  const [open, setOpen] = useState(false);
  const { transactions } = useTransactions(false);
  const categoriesOptions = [...new Set(transactions.map((t) => t.category))];

  const handleChange = (category: string) => {
    const newSelectedCategories = new Set(categories);
    if (newSelectedCategories.has(category)) {
      newSelectedCategories.delete(category);
    } else {
      newSelectedCategories.add(category);
    }
    onCategorySelected(newSelectedCategories);
  };

  const handleSearchInput = (e: ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  return (
    <div className="flex w-full max-w-sm items-center space-x-2">
      <Input type="text" placeholder="Buscar..." value={search} onInput={handleSearchInput} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[200px] justify-between"
          >
            {categories.size > 0
              ? [...categories.values()].join(", ")
              : "Selecciona categorias"}
            <ChevronsUpDown className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder="Busca categoria..." className="h-9" />
            <CommandList>
              <CommandEmpty>No se encontraron categorias.</CommandEmpty>
              <CommandGroup>
                {categoriesOptions.map((category) => (
                  <CommandItem key={category} value={category} onSelect={handleChange}>
                    <CategoryIcon size="sm" category={category} />
                    {category}
                    <Check
                      className={cn(
                        "ml-auto",
                        categories.has(category) ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default ExpensesFilters;
