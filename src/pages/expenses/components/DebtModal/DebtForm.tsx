import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatDateOnly, parseDateOnly } from "@/lib/DateUtils";
import { cn, getDateString } from "@/lib/utils";
import type { Currency, Debt, DebtPayload, DebtType } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, LoaderCircle, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useDebts } from "../../hooks/useDebts";

const schema = z.object({
  type: z.enum(["receivable", "payable"]),
  counterparty: z
    .string({ required_error: "La contraparte es obligatoria" })
    .min(1, "La contraparte es obligatoria")
    .max(120),
  amount: z
    .number({ invalid_type_error: "El monto debe ser un número" })
    .positive("El monto debe ser mayor a 0"),
  currency: z.enum(["MXN", "USD"]),
  date: z.date({ required_error: "La fecha es obligatoria" }),
  dueDate: z.date().optional(),
  notes: z.string().max(300).optional(),
});

type FormValues = z.infer<typeof schema>;

const typeOptions: { value: DebtType; label: string }[] = [
  { value: "receivable", label: "Por cobrar" },
  { value: "payable", label: "Por pagar" },
];

const currencyOptions: Currency[] = ["MXN", "USD"];

function DebtForm({
  debt,
  defaultType,
  onClose,
}: {
  debt: Debt | null;
  defaultType: DebtType;
  onClose: () => void;
}) {
  const { createDebt, updateDebt, archiveDebt, debtMutationLoading } = useDebts();
  const [dateOpen, setDateOpen] = useState(false);
  const [dueOpen, setDueOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: debt?.type ?? defaultType,
      counterparty: debt?.counterparty ?? "",
      amount: debt?.amount ?? 0,
      currency: debt?.currency ?? "MXN",
      date: debt?.date ? parseDateOnly(debt.date) : new Date(),
      dueDate: debt?.dueDate ? parseDateOnly(debt.dueDate) : undefined,
      notes: debt?.notes ?? "",
    },
  });

  const mutationError = createDebt.error ?? updateDebt.error ?? archiveDebt.error;

  function onSubmit(values: FormValues) {
    const payload: DebtPayload = {
      type: values.type,
      counterparty: values.counterparty,
      amount: values.amount,
      currency: values.currency,
      date: formatDateOnly(values.date),
      dueDate: values.dueDate ? formatDateOnly(values.dueDate) : null,
      notes: values.notes?.trim() ? values.notes.trim() : null,
    };
    if (debt) {
      updateDebt.mutate({ id: debt.id, payload }, { onSuccess: onClose });
    } else {
      createDebt.mutate(payload, { onSuccess: onClose });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 pb-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="grid grid-cols-2 gap-2"
                >
                  {typeOptions.map((option) => (
                    <FormItem
                      key={option.value}
                      className={cn(
                        "flex items-center gap-2 rounded-md border p-2",
                        field.value === option.value && "border-primary"
                      )}
                    >
                      <FormControl>
                        <RadioGroupItem value={option.value} />
                      </FormControl>
                      <FormLabel className="font-normal">{option.label}</FormLabel>
                    </FormItem>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="counterparty"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Persona o entidad</FormLabel>
              <FormControl>
                <Input placeholder="A quién le prestaste / a quién le debes" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monto</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="decimal"
                    {...field}
                    onChange={(event) => field.onChange(event.target.valueAsNumber)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Moneda</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="flex gap-2"
                  >
                    {currencyOptions.map((currency) => (
                      <FormItem
                        key={currency}
                        className={cn(
                          "flex flex-1 items-center gap-2 rounded-md border p-2",
                          field.value === currency && "border-primary"
                        )}
                      >
                        <FormControl>
                          <RadioGroupItem value={currency} />
                        </FormControl>
                        <FormLabel className="font-normal">{currency}</FormLabel>
                      </FormItem>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="date"
            render={({ field: { value, onChange } }) => (
              <FormItem>
                <FormLabel>Fecha</FormLabel>
                <Popover open={dateOpen} onOpenChange={setDateOpen}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" className="w-full justify-start cursor-pointer">
                      <CalendarIcon className="mr-2 size-4" />
                      {value ? getDateString(value) : "Fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={value}
                      onSelect={(date) => {
                        if (date) onChange(date);
                        setDateOpen(false);
                      }}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field: { value, onChange } }) => (
              <FormItem>
                <FormLabel>Fecha límite (opcional)</FormLabel>
                <div className="flex items-center gap-1">
                  <Popover open={dueOpen} onOpenChange={setDueOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start cursor-pointer"
                      >
                        <CalendarIcon className="mr-2 size-4" />
                        {value ? getDateString(value) : "Sin fecha"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={value}
                        onSelect={(date) => {
                          onChange(date ?? undefined);
                          setDueOpen(false);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  {value && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="cursor-pointer"
                      aria-label="Quitar fecha límite"
                      onClick={() => onChange(undefined)}
                    >
                      <X />
                    </Button>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas (opcional)</FormLabel>
              <FormControl>
                <Input placeholder="Detalle" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {mutationError && (
          <p role="alert" className="text-sm text-destructive">
            {mutationError.message}
          </p>
        )}

        <div className="flex justify-end gap-3">
          {debt && (
            <Button
              type="button"
              variant="destructive"
              className="mr-auto cursor-pointer"
              disabled={debtMutationLoading}
              onClick={() => archiveDebt.mutate(debt.id, { onSuccess: onClose })}
            >
              Archivar
            </Button>
          )}
          <Button type="button" variant="secondary" className="cursor-pointer" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={debtMutationLoading}>
            {debtMutationLoading && <LoaderCircle className="mr-2 animate-spin" />}
            {debt ? "Guardar" : "Crear deuda"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default DebtForm;
