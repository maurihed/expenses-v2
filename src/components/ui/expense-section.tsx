import clsx from "clsx";
import type { ReactNode } from "react";

function ExpenseSection({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx("surface rounded-2xl", className)}>{children}</div>;
}

export { ExpenseSection };
