import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import { formatMoney } from "@/lib/utils";
import MarketService from "@/services/MarketService";
import type { MarketQuote, MarketSearchResult } from "@/types";
import { LoaderCircle, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useHoldingMutations } from "../../hooks/useHoldings";
import { useMarketSearch } from "../../hooks/useMarketSearch";

type Props = {
  accountId: string;
  currency: string;
  open: boolean;
  onClose: () => void;
};

function AddHoldingDrawer({ accountId, currency, open, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<MarketSearchResult | null>(null);
  const [quote, setQuote] = useState<MarketQuote | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualSymbol, setManualSymbol] = useState("");
  const [manualError, setManualError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [deduct, setDeduct] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { results, searching, searchError } = useMarketSearch(query);
  const { createHolding, holdingMutationLoading } = useHoldingMutations(accountId);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelected(null);
      setQuote(null);
      setManualMode(false);
      setManualSymbol("");
      setManualError(null);
      setQuantity("");
      setDeduct(false);
      setError(null);
    }
  }, [open]);

  const parsedQuantity = Number(quantity);
  const canSubmit =
    selected != null && Number.isFinite(parsedQuantity) && parsedQuantity > 0 && !holdingMutationLoading;
  const preview =
    quote?.price != null && Number.isFinite(parsedQuantity) && parsedQuantity > 0
      ? parsedQuantity * quote.price
      : null;

  const handleSelect = async (result: MarketSearchResult) => {
    setSelected(result);
    setQuote(null);
    try {
      setQuote(await MarketService.getQuote(result.symbol));
    } catch {
      // La previsualización es opcional; el alta valida en el backend.
    }
  };

  const handleValidateManual = async () => {
    const symbol = manualSymbol.trim().toUpperCase();
    if (!symbol) return;
    setValidating(true);
    setManualError(null);
    try {
      const fetched = await MarketService.getQuote(symbol);
      if (fetched.price == null) {
        setManualError("No encontramos ese símbolo.");
        return;
      }
      setSelected({
        symbol: fetched.symbol,
        name: fetched.name ?? fetched.symbol,
        exchange: fetched.exchange,
        currency: fetched.currency,
      });
      setQuote(fetched);
      setManualMode(false);
    } catch (validateError) {
      setManualError((validateError as Error).message);
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = () => {
    if (!selected || !canSubmit) return;
    setError(null);
    createHolding.mutate(
      { symbol: selected.symbol, quantity: parsedQuantity, deductFromCash: deduct },
      { onSuccess: () => onClose(), onError: (mutationError) => setError(mutationError.message) }
    );
  };

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DrawerContent aria-describedby="add-holding-description" className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle className="font-display">Agregar ETF</DrawerTitle>
          <DrawerDescription id="add-holding-description">
            Busca por nombre o ticker y captura tu cantidad.
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-6">
          {!selected && !manualMode && (
            <>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  autoFocus
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Busca un ETF (ej. VOO, Vanguard)"
                  className="h-11 pl-9"
                />
              </div>

              {searching && <Loader />}

              {!searching && searchError && (
                <p className="text-sm text-destructive">
                  No pudimos buscar. Usa el ticker manual.
                </p>
              )}

              {!searching && !searchError && query.trim().length >= 2 && results.length === 0 && (
                <p className="text-sm text-muted-foreground">Sin resultados.</p>
              )}

              <ul className="flex flex-col gap-2">
                {results.map((result) => (
                  <li key={result.symbol}>
                    <button
                      type="button"
                      onClick={() => handleSelect(result)}
                      className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-border p-3 text-left transition-colors duration-200 hover:bg-muted"
                    >
                      <span className="shrink-0 rounded-md bg-muted px-2 py-1 text-xs font-semibold">
                        {result.symbol}
                      </span>
                      <span className="min-w-0 grow">
                        <span className="block truncate text-sm font-medium">{result.name}</span>
                        {result.exchange && (
                          <span className="block truncate text-xs text-muted-foreground">
                            {result.exchange}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>

              <Button
                type="button"
                variant="ghost"
                className="h-11 cursor-pointer"
                onClick={() => setManualMode(true)}
              >
                Escribir el ticker manualmente
              </Button>
            </>
          )}

          {!selected && manualMode && (
            <>
              <Input
                autoFocus
                value={manualSymbol}
                onChange={(event) => setManualSymbol(event.target.value)}
                placeholder="Ticker (ej. VOO)"
                className="h-11 uppercase"
              />
              {manualError && <p className="text-sm text-destructive">{manualError}</p>}
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  className="h-11 cursor-pointer"
                  onClick={() => {
                    setManualMode(false);
                    setManualError(null);
                  }}
                >
                  Volver
                </Button>
                <Button
                  type="button"
                  className="h-11 cursor-pointer"
                  onClick={handleValidateManual}
                  disabled={validating || manualSymbol.trim() === ""}
                >
                  {validating && <LoaderCircle className="mr-2 animate-spin" />}
                  Validar
                </Button>
              </div>
            </>
          )}

          {selected && (
            <>
              <div className="flex items-center gap-3 rounded-xl border border-border p-3">
                <span className="shrink-0 rounded-md bg-muted px-2 py-1 text-xs font-semibold">
                  {selected.symbol}
                </span>
                <span className="min-w-0 grow truncate text-sm">{selected.name}</span>
                <button
                  type="button"
                  className="min-h-11 cursor-pointer px-2 text-xs text-primary"
                  onClick={() => {
                    setSelected(null);
                    setQuote(null);
                  }}
                >
                  Cambiar
                </button>
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium">Cantidad</span>
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.00000001"
                  min="0"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  className="h-11"
                  placeholder="0"
                />
              </label>

              <label className="flex items-start gap-3 rounded-xl border border-border p-3">
                <input
                  type="checkbox"
                  checked={deduct}
                  onChange={(event) => setDeduct(event.target.checked)}
                  className="mt-0.5 size-4 cursor-pointer accent-[var(--primary)]"
                />
                <span className="text-sm">
                  Descontar del efectivo (registrar compra)
                  <span className="block text-xs text-muted-foreground">
                    {preview != null
                      ? `Se descontarán ≈ ${formatMoney(preview, quote?.currency ?? "USD")}`
                      : `Se descontará de tu efectivo en ${currency}.`}
                  </span>
                </span>
              </label>

              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  className="h-11 cursor-pointer"
                  onClick={onClose}
                  disabled={holdingMutationLoading}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  className="h-11 cursor-pointer"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                >
                  {holdingMutationLoading && <LoaderCircle className="mr-2 animate-spin" />}
                  Agregar
                </Button>
              </div>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export default AddHoldingDrawer;
