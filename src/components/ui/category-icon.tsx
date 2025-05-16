import { getCategoryInfo } from "@/lib/CategoryUtils";
import type { Categories } from "@/types";
import clsx from "clsx";

type CategoryIconProps = {
  category: Categories;
  size?: "sm" | "md" | "lg";
};

function CategoryIcon({ category, size = "lg" }: CategoryIconProps) {
  const { icon: Icon, color } = getCategoryInfo(category);
  const iconSize = size === "sm" ? 16 : size === "lg" ? 40 : 24;

  return (
    <span
      className={clsx([
        `rounded-full p-2 flex items-center justify-center`,
        color,
        {
          "w-8 h-8": size === "md",
          "w-6 h-6": size === "sm",
          "w-10 h-10": size === "lg",
        },
      ])}
    >
      <Icon size={iconSize} className="text-white" />
    </span>
  );
}

export { CategoryIcon };
