import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatMoney = (amount: number) => {
  const moneyFormatter = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 1,
  });
  return moneyFormatter.format(amount);
};

export * from "./CategoryUtils";
export * from "./DateUtils";
