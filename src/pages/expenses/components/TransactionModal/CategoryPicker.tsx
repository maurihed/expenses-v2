import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/components/ui/category-icon";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useCategories } from "../../hooks/useCategories";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function CategoryPicker({ value, onChange }: Props) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const { categories } = useCategories();

  const options = useMemo(() => {
    const list = categories.map((category) => category.name);
    // Keep a legacy category visible even if it is no longer in the API.
    if (value && !list.includes(value)) {
      list.unshift(value);
    }
    return list;
  }, [categories, value]);

  const filteredCategories = options.filter((category) =>
    category.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    // Set default value if no value is selected and options are available
    if (!value && options.length > 0) {
      onChange(options[0]);
    }
  }, [value, options, onChange]);

  const selectedCategory = categories.find((category) => category.name === value);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <div className="flex items-center p-1 bg-background border rounded-md cursor-pointer w-full gap-4">
          <CategoryIcon
            size="md"
            category={value}
            icon={selectedCategory?.icon}
            color={selectedCategory?.color}
          />
          <span>{value}</span>
        </div>
      </DrawerTrigger>
      <DrawerContent aria-describedby="category-picker">
        <DrawerHeader>
          <DrawerTitle>Selecciona una categoria</DrawerTitle>
          <Input
            value={search}
            onInput={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          />
        </DrawerHeader>
        <div className="px-4 h-96 overflow-y-auto">
          {filteredCategories.map((category) => {
            const info = categories.find((option) => option.name === category);
            return (
              <Button
                asChild
                variant="ghost"
                key={category}
                className="flex justify-start gap-4 hover:bg-gray-100 cursor-pointer border-b"
                onClick={() => {
                  onChange(category);
                  setSearch("");
                  setOpen(false);
                }}
              >
                <div className="mb-4">
                  <CategoryIcon
                    size="md"
                    category={category}
                    icon={info?.icon}
                    color={info?.color}
                  />
                  <span>{category}</span>
                </div>
              </Button>
            );
          })}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
