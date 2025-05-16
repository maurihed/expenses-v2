import clsx from "clsx";
import type { ReactNode } from "react";

function ExpenseSection({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx("bg-slate-900 rounded-lg", className)}>{children}</div>;
}

export { ExpenseSection };
