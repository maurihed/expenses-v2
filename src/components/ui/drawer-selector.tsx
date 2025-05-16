import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { useEffect, useState, type ChangeEvent } from "react";

export type DrawerSelectorItem = {
  key: string;
  value: string;
};

type Props = {
  items: DrawerSelectorItem[];
  value: string;
  onChange: (value: string) => void;
  renderItem: (item: DrawerSelectorItem) => React.ReactNode;
};

export default function DrawerSelector({ items, value, onChange, renderItem }: Props) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filteredCategories = items.filter((item) =>
    item.value.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    // Set default value if no value is selected
    if (!value) {
      onChange(items[0].key);
    }
  }, [value]);

  const selectedItem = items.find((item) => item.key === value);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <div className="flex items-center p-1 bg-input/30 border rounded-md cursor-pointer w-full gap-4">
          {selectedItem ? renderItem(selectedItem) : "Selecciona"}
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
        <div className="px-4 max-h-96 overflow-y-auto grid grid-cols-1 gap-4 pb-4 auto-rows-min">
          {filteredCategories.map((_item) => (
            <Button
              asChild
              variant="ghost"
              key={_item.key}
              className="flex justify-start gap-4 hover:bg-gray-100 cursor-pointer border-b"
              onClick={() => {
                onChange(_item.key);
                setSearch("");
                setOpen(false);
              }}
            >
              <div>{renderItem(_item)}</div>
            </Button>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
