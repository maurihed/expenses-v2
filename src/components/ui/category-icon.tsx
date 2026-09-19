import { getCategoryInfo } from "@/lib/CategoryUtils";
import { CATEGORY_ICONS } from "@/lib/categoryIcons";
import clsx from "clsx";

type CategoryIconProps = {
  category: string;
  icon?: string | null;
  color?: string | null;
  size?: "sm" | "md" | "lg";
};

function CategoryIcon({ category, icon, color, size = "lg" }: CategoryIconProps) {
  const info = getCategoryInfo(category);
  const Icon = (icon ? CATEGORY_ICONS[icon] : undefined) ?? info.icon;
  const iconSize = size === "sm" ? 16 : size === "lg" ? 40 : 24;

  return (
    <span
      style={color ? { backgroundColor: color } : undefined}
      className={clsx([
        `rounded-full p-2 flex items-center justify-center`,
        !color && info.color,
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
