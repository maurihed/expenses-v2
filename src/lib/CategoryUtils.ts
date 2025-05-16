import {
  BrushCleaning,
  Cake,
  Car,
  Cigarette,
  Dices,
  Droplet,
  Fuel,
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
  Utensils,
  type LucideProps,
} from "lucide-react";

import type { ForwardRefExoticComponent } from "react";

type CategoryInfo = {
  icon: ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;
  color: string;
  rawColor: string;
};

export const getCategoryInfo = (category: string): CategoryInfo => {
  switch (category) {
    case "Supermercado":
      return {
        icon: ShoppingBasket,
        color: "bg-red-700",
        rawColor: "#b91c1c",
      };
    case "Restaurante":
      return {
        icon: Utensils,
        color: "bg-orange-600",
        rawColor: "#ea580c",
      };
    case "Transporte":
      return {
        icon: Car,
        color: "bg-amber-700",
        rawColor: "#b45309",
      };
    case "Limpeza":
      return {
        icon: BrushCleaning,
        color: "bg-yellow-500",
        rawColor: "#eab308",
      };
    case "Electronicos":
      return {
        icon: Plug,
        color: "bg-lime-600",
        rawColor: "#65a30d",
      };
    case "Mascotas":
      return {
        icon: PawPrint,
        color: "bg-green-700",
        rawColor: "#15803d",
      };
    case "Recreacion":
      return {
        icon: Cigarette,
        color: "bg-green-500",
        rawColor: "#22c55e",
      };
    case "Ropa":
      return {
        icon: Shirt,
        color: "bg-emerald-600",
        rawColor: "#059669",
      };
    case "Salud":
      return {
        icon: Heart,
        color: "bg-cyan-600",
        rawColor: "#0891b2",
      };
    case "Servicio":
      return {
        icon: ReceiptText,
        color: "bg-sky-600",
        rawColor: "#0284c7",
      };
    case "Viaje":
      return {
        icon: Plane,
        color: "bg-blue-800",
        rawColor: "#1e40af",
      };
    case "Vivienda":
      return {
        icon: House,
        color: "bg-blue-400",
        rawColor: "#60a5fa",
      };
    case "Hormiga":
      return {
        icon: Droplet,
        color: "bg-violet-700",
        rawColor: "#6d28d9",
      };
    case "Caridad":
      return {
        icon: HeartHandshake,
        color: "bg-purple-600",
        rawColor: "#9333ea",
      };
    case "Otros":
      return {
        icon: Layers,
        color: "bg-fuchsia-600",
        rawColor: "#c026d3",
      };
    case "Despensa":
      return {
        icon: ShoppingCart,
        color: "bg-red-700",
        rawColor: "#920B3A",
      };
    case "Cenas":
      return {
        icon: Hamburger,
        color: "bg-green-700",
        rawColor: "#0E793C",
      };
    case "Familia":
      return {
        icon: HeartHandshake,
        color: "bg-blue-700",
        rawColor: "#09AACD",
      };
    case "Gasolina":
      return {
        icon: Fuel,
        color: "bg-yellow-400",
        rawColor: "#F7B750",
      };
    case "Viajes":
      return {
        icon: Plane,
        color: "bg-purple-500",
        rawColor: "#7828C8",
      };
    case "Juegos":
      return {
        icon: Dices,
        color: "bg-blue-400",
        rawColor: "#338EF7",
      };
    case "Papeleria":
      return {
        icon: Paperclip,
        color: "bg-yellow-600",
        rawColor: "#C4841D",
      };
    case "Pasteleria":
      return {
        icon: Cake,
        color: "bg-pink-500",
        rawColor: "#FF4ECD",
      };
    default:
      return {
        icon: Layers,
        color: "bg-rose-700",
        rawColor: "#be123c",
      };
  }
};
