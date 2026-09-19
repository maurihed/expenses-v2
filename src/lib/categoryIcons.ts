import {
  Baby,
  BrushCleaning,
  Cake,
  Car,
  Cigarette,
  Coffee,
  Dices,
  Droplet,
  Fuel,
  Gift,
  Hamburger,
  Heart,
  HeartHandshake,
  House,
  Layers,
  Paperclip,
  PawPrint,
  Plane,
  Plug,
  ReceiptText,
  Shirt,
  ShoppingBasket,
  ShoppingCart,
  Tag,
  Utensils,
  type LucideIcon,
} from "lucide-react";

/**
 * Curated set of Lucide icons available for categories.
 * It includes every icon already referenced by `CategoryUtils` so legacy
 * categories keep rendering after they are migrated to the API.
 */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Baby,
  BrushCleaning,
  Cake,
  Car,
  Cigarette,
  Coffee,
  Dices,
  Droplet,
  Fuel,
  Gift,
  Hamburger,
  Heart,
  HeartHandshake,
  House,
  Layers,
  Paperclip,
  PawPrint,
  Plane,
  Plug,
  ReceiptText,
  Shirt,
  ShoppingBasket,
  ShoppingCart,
  Tag,
  Utensils,
};

export const CATEGORY_ICON_NAMES = Object.keys(CATEGORY_ICONS);

/**
 * Swatches offered in the category form. Brand pink `#F8359B` is first.
 */
export const CATEGORY_COLORS = [
  "#F8359B",
  "#b91c1c",
  "#ea580c",
  "#b45309",
  "#eab308",
  "#65a30d",
  "#15803d",
  "#22c55e",
  "#059669",
  "#0891b2",
  "#0284c7",
  "#1e40af",
  "#6d28d9",
  "#9333ea",
  "#c026d3",
  "#be123c",
];

export const DEFAULT_CATEGORY_ICON = "Tag";
export const DEFAULT_CATEGORY_COLOR = "#F8359B";
