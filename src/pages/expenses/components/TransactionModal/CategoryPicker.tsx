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
import { Categories } from "@/types";
import { useEffect, useState, type ChangeEvent } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function CategoryPicker({ value, onChange }: Props) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const filteredCategories = Object.values(Categories).filter((category) =>
    category.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    // Set default value if no value is selected
    if (!value) {
      onChange(Object.values(Categories)[0]);
    }
  }, [value]);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <div className="flex items-center p-1 bg-primary-foreground border rounded-md cursor-pointer w-full gap-4">
          <CategoryIcon size="md" category={value as Categories} />
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
          {filteredCategories.map((category) => (
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
                <CategoryIcon size="md" category={category} />
                <span>{category}</span>
              </div>
            </Button>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
