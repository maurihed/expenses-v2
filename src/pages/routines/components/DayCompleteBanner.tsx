import { Sparkles, Trophy } from "lucide-react";

interface DayCompleteBannerProps {
  sessionName: string;
}

function DayCompleteBanner({ sessionName }: DayCompleteBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-300/60 bg-gradient-to-br from-emerald-50 to-emerald-100/60 px-5 py-5 text-emerald-800 dark:border-emerald-800/60 dark:from-emerald-950/40 dark:to-emerald-950/20 dark:text-emerald-200">
      <div className="absolute right-0 top-0 -mr-3 -mt-3 flex opacity-20 dark:opacity-30">
        <Sparkles className="size-16 text-emerald-500" />
      </div>
      <div className="flex items-center gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-200/60 text-emerald-600 dark:bg-emerald-800/60 dark:text-emerald-300">
          <Trophy className="size-6" />
        </div>
        <div className="flex-1">
          <p className="text-base font-bold">Día completado</p>
          <p className="mt-0.5 text-sm text-emerald-600 dark:text-emerald-400">
            {sessionName}
          </p>
        </div>
      </div>
    </div>
  );
}

export default DayCompleteBanner;
