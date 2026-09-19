import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, formatMoney } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";

export type InterestTierRow = {
  upTo: number | null;
  annualRatePercent: number;
};

type Props = {
  tiers: InterestTierRow[];
  balance: number;
  currency?: string;
  onChange: (tiers: InterestTierRow[]) => void;
  error?: string;
};

const computeMonthlyInterest = (balance: number, tiers: InterestTierRow[]): number => {
  const sorted = [...tiers].sort((a, b) => {
    if (a.upTo === null) return 1;
    if (b.upTo === null) return -1;
    return a.upTo - b.upTo;
  });

  let previousCap = 0;
  let interest = 0;

  for (const tier of sorted) {
    const cap = tier.upTo ?? Infinity;
    const portion = Math.max(0, Math.min(balance, cap) - previousCap);
    interest += (portion * (tier.annualRatePercent / 100)) / 12;
    previousCap = cap;
    if (balance <= previousCap) break;
  }

  return Math.round(interest * 100) / 100;
};

function InterestTiersEditor({ tiers, balance, currency = "MXN", onChange, error }: Props) {
  const updateTier = (index: number, patch: Partial<InterestTierRow>) => {
    onChange(tiers.map((tier, i) => (i === index ? { ...tier, ...patch } : tier)));
  };

  const addTier = () => {
    const next = tiers.map((tier) => ({ ...tier }));
    const last = next[next.length - 1];
    if (!last) {
      next.push({ upTo: null, annualRatePercent: 0 });
    } else if (last.upTo === null) {
      const previousCap = next.length >= 2 ? next[next.length - 2].upTo ?? 0 : 0;
      last.upTo = previousCap + 50000;
      next.push({ upTo: null, annualRatePercent: last.annualRatePercent });
    } else {
      next.push({ upTo: null, annualRatePercent: 0 });
    }
    onChange(next);
  };

  const removeTier = (index: number) => {
    const next = tiers.filter((_, i) => i !== index).map((tier) => ({ ...tier }));
    if (next.length > 0) {
      next[next.length - 1].upTo = null;
    }
    onChange(next);
  };

  const estimated = computeMonthlyInterest(balance, tiers);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">Tramos de interés</span>
        <Button type="button" variant="outline" size="sm" className="cursor-pointer" onClick={addTier}>
          <Plus />
          Agregar tramo
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {tiers.map((tier, index) => {
          const isLast = index === tiers.length - 1;
          const invalidCap = !isLast && (tier.upTo === null || tier.upTo <= 0);
          return (
            <div
              key={index}
              className="flex flex-col gap-2 rounded-md border border-border bg-background/40 p-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  Tramo {index + 1}
                </span>
                {tiers.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="cursor-pointer text-destructive hover:text-destructive"
                    aria-label={`Eliminar tramo ${index + 1}`}
                    onClick={() => removeTier(index)}
                  >
                    <Trash2 />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground" htmlFor={`tier-cap-${index}`}>
                    Monto hasta
                  </label>
                  <Input
                    id={`tier-cap-${index}`}
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    placeholder={isLast ? "Sin límite" : "0.00"}
                    disabled={isLast}
                    value={isLast ? "" : Number.isFinite(tier.upTo ?? NaN) ? (tier.upTo as number) : ""}
                    onChange={(event) =>
                      updateTier(index, {
                        upTo: Number.isNaN(event.target.valueAsNumber)
                          ? null
                          : event.target.valueAsNumber,
                      })
                    }
                    className={cn(invalidCap && "border-destructive")}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground" htmlFor={`tier-rate-${index}`}>
                    Tasa anual (%)
                  </label>
                  <Input
                    id={`tier-rate-${index}`}
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    value={Number.isFinite(tier.annualRatePercent) ? tier.annualRatePercent : ""}
                    onChange={(event) =>
                      updateTier(index, {
                        annualRatePercent: Number.isNaN(event.target.valueAsNumber)
                          ? 0
                          : event.target.valueAsNumber,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-md bg-primary-100 p-3 text-sm text-primary-700">
        Interés mensual estimado:{" "}
        <span className="font-semibold tabular-nums">{formatMoney(estimated, currency)}</span>
        <span className="mt-1 block text-xs">
          Calculado con el saldo actual de la cuenta seleccionada.
        </span>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export default InterestTiersEditor;
