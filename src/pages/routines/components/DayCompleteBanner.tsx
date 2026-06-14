import { Check, Trophy } from "lucide-react";

interface DayCompleteBannerProps {
  sessionName: string;
}

function DayCompleteBanner({ sessionName }: DayCompleteBannerProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-emerald-300 bg-emerald-50 px-5 py-4 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
      <Trophy className="size-6 shrink-0" />
      <div>
        <p className="font-semibold">Día completado</p>
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          {sessionName}
        </p>
      </div>
      <Check className="ml-auto size-5 shrink-0" />
    </div>
  );
}

export default DayCompleteBanner;
