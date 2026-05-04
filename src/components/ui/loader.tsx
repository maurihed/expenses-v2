import { Loader2 } from "lucide-react";
import clsx from "clsx";

function Loader({ className }: { className?: string }) {
  return (
    <div className={clsx("flex items-center justify-center py-8", className)}>
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export { Loader };
