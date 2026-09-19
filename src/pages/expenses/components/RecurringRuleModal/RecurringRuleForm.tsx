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
import DrawerSelector from "@/components/ui/drawer-selector";
import {
  cn,
  formatDateOnly,
  getDateString,
  parseDateOnly,
} from "@/lib/utils";
import type {
  RecurringFrequency,
  RecurringRule,
  RecurringRulePayload,
  RecurringType,
} from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, LoaderCircle, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAccounts } from "../../hooks/useAccounts";
import { useCategories } from "../../hooks/useCategories";
import { usePersons } from "../../hooks/usePersons";
import { useRecurringMutations } from "../../hooks/useRecurring";
import InterestTiersEditor, { type InterestTierRow } from "./InterestTiersEditor";

const typeOptions: { value: RecurringType; label: string }[] = [
  { value: "subscription", label: "Suscripción" },
  { value: "income", label: "Ingreso" },
  { value: "interest", label: "Interés" },
];

const frequencyOptions: { value: RecurringFrequency; label: string }[] = [
  { value: "weekly", label: "Semanal" },
  { value: "biweekly", label: "Quincenal" },
  { value: "monthly", label: "Mensual" },
];

const interestTierSchema = z.object({
  upTo: z.number().nullable(),
  annualRatePercent: z.number({
    invalid_type_error: "Ingresa una tasa",
    required_error: "Ingresa una tasa",
  }),
});

const recurringFormSchema = z
  .object({
    name: z
      .string({ required_error: "El nombre es obligatorio" })
      .trim()
      .min(1, "El nombre es obligatorio")
      .max(100),
    type: z.enum(["subscription", "income", "interest"], {
      required_error: "El tipo es obligatorio",
    }),
    accountId: z.string().min(1, "La cuenta es obligatoria"),
    categoryId: z.string().optional(),
    scope: z.enum(["joint", "personal"]),
    personId: z.string().optional(),
    amount: z
      .number({
        invalid_type_error: "Ingresa un monto",
        required_error: "Ingresa un monto",
      })
      .optional(),
    frequency: z.enum(["weekly", "biweekly", "monthly"], {
      required_error: "La frecuencia es obligatoria",
    }),
    startDate: z.date({ required_error: "La fecha de inicio es obligatoria" }),
    endDate: z.date().optional(),
    active: z.boolean(),
    interestTiers: z.array(interestTierSchema),
  })
  .superRefine((values, ctx) => {
    const isInterest = values.type === "interest";

    if (!isInterest && (values.amount === undefined || values.amount <= 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["amount"],
        message: "Ingresa un monto mayor a 0",
      });
    }

    if (values.type === "subscription" && !values.categoryId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["categoryId"],
        message: "La categoría es obligatoria",
      });
    }

    if (values.scope === "personal" && !values.personId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["personId"],
        message: "La persona es obligatoria",
      });
    }

    if (isInterest) {
      if (values.interestTiers.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["interestTiers"],
          message: "Agrega al menos un tramo",
        });
      } else {
        const last = values.interestTiers[values.interestTiers.length - 1];
        if (last.upTo !== null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["interestTiers"],
            message: "El último tramo debe quedar sin límite",
          });
        }
        values.interestTiers.forEach((tier, index) => {
          const isLast = index === values.interestTiers.length - 1;
          if (!isLast && (tier.upTo === null || tier.upTo <= 0)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["interestTiers", index, "upTo"],
              message: "Requerido",
            });
          }
        });
      }
    }

    if (values.endDate && values.endDate < values.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "Debe ser posterior a la fecha de inicio",
      });
    }
  });

type RecurringFormValues = z.infer<typeof recurringFormSchema>;

type Props = {
  rule: RecurringRule | null;
  onClose: () => void;
};

const toTierRows = (rule: RecurringRule | null): InterestTierRow[] => {
  if (rule?.interestTiers && rule.interestTiers.length > 0) {
    return rule.interestTiers.map((tier) => ({
      upTo: tier.upTo,
      annualRatePercent: tier.annualRate * 100,
    }));
  }
  return [{ upTo: null, annualRatePercent: 0 }];
};

function RecurringRuleForm({ rule, onClose }: Props) {
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  const { accounts } = useAccounts(true, true);
  const { createRule, updateRule, recurringMutationLoading } = useRecurringMutations();

  const form = useForm<RecurringFormValues>({
    resolver: zodResolver(recurringFormSchema),
    defaultValues: {
      name: rule?.name ?? "",
      type: rule?.type ?? "subscription",
      accountId: rule?.accountId ?? "",
      categoryId: rule?.categoryId ?? "",
      scope: rule?.scope ?? "joint",
      personId: rule?.personId ?? "",
      amount: rule?.amount ?? undefined,
      frequency: rule?.frequency ?? "monthly",
      startDate: rule?.startDate ? parseDateOnly(rule.startDate) : new Date(),
      endDate: rule?.endDate ? parseDateOnly(rule.endDate) : undefined,
      active: rule?.active ?? true,
      interestTiers: toTierRows(rule),
    },
  });

  const selectedType = form.watch("type");
  const selectedScope = form.watch("scope");
  const selectedAccountId = form.watch("accountId");
  const tiers = form.watch("interestTiers");

  const isInterest = selectedType === "interest";
  const isPersonal = selectedScope === "personal";

  const { categories } = useCategories(selectedType === "subscription");
  const { persons } = usePersons(isPersonal);

  const selectedAccount = accounts.find((account) => account.id === selectedAccountId);
  const mutationError = createRule.error ?? updateRule.error;

  useEffect(() => {
    if (selectedType === "interest") {
      form.setValue("frequency", "monthly");
    }
  }, [selectedType, form]);

  const accountItems = useMemo(
    () => accounts.map((account) => ({ key: account.id, value: account.name })),
    [accounts]
  );

  const categoryItems = useMemo(
    () => categories.map((category) => ({ key: category.id, value: category.name })),
    [categories]
  );

  const personItems = useMemo(
    () => persons.map((person) => ({ key: person.id, value: person.name })),
    [persons]
  );

  function onSubmit(values: RecurringFormValues) {
    const frequency = values.type === "interest" ? "monthly" : values.frequency;
    const payload: RecurringRulePayload = {
      name: values.name.trim(),
      type: values.type,
      accountId: values.accountId,
      categoryId: values.type === "subscription" ? values.categoryId || null : null,
      scope: values.scope,
      personId: values.scope === "personal" ? values.personId || null : null,
      amount: values.type === "interest" ? null : values.amount,
      frequency,
      dayOfMonth: frequency === "monthly" ? values.startDate.getDate() : null,
      dayOfWeek: frequency === "monthly" ? null : values.startDate.getDay(),
      startDate: formatDateOnly(values.startDate),
      endDate: values.endDate ? formatDateOnly(values.endDate) : null,
      interestTiers:
        values.type === "interest"
          ? values.interestTiers.map((tier) => ({
              upTo: tier.upTo,
              annualRate: tier.annualRatePercent / 100,
            }))
          : null,
      active: values.active,
    };

    if (rule) {
      updateRule.mutate({ id: rule.id, rule: payload }, { onSuccess: () => onClose() });
    } else {
      createRule.mutate(payload, { onSuccess: () => onClose() });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input placeholder="Ej. Netflix, Nómina, Interés inversión" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo</FormLabel>
              <FormControl>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="grid grid-cols-2 gap-2"
                >
                  {typeOptions.map((option) => (
                    <div
                      key={option.value}
                      onClick={() => field.onChange(option.value)}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-md border p-3 transition-colors duration-200",
                        field.value === option.value ? "border-primary bg-primary-100" : "border-border"
                      )}
                    >
                      <RadioGroupItem value={option.value} id={`recurring-type-${option.value}`} />
                      <span className="text-sm">{option.label}</span>
                    </div>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="accountId"
          render={({ field: { value, onChange } }) => (
            <FormItem>
              <FormLabel>Cuenta</FormLabel>
              <FormControl>
                <DrawerSelector
                  items={accountItems}
                  value={value}
                  onChange={onChange}
                  renderItem={(item) => <span>{item.value}</span>}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedType === "subscription" && (
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field: { value, onChange } }) => (
              <FormItem>
                <FormLabel>Categoría</FormLabel>
                <FormControl>
                  <DrawerSelector
                    items={categoryItems}
                    value={value ?? ""}
                    onChange={onChange}
                    renderItem={(item) => <span>{item.value}</span>}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="scope"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Alcance</FormLabel>
              <FormControl>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="grid grid-cols-2 gap-2"
                >
                  <div
                    onClick={() => field.onChange("joint")}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-md border p-3 transition-colors duration-200",
                      field.value === "joint" ? "border-primary bg-primary-100" : "border-border"
                    )}
                  >
                    <RadioGroupItem value="joint" id="recurring-scope-joint" />
                    <span className="text-sm">Conjunto</span>
                  </div>
                  <div
                    onClick={() => field.onChange("personal")}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-md border p-3 transition-colors duration-200",
                      field.value === "personal" ? "border-primary bg-primary-100" : "border-border"
                    )}
                  >
                    <RadioGroupItem value="personal" id="recurring-scope-personal" />
                    <span className="text-sm">Personal</span>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {isPersonal && (
          <FormField
            control={form.control}
            name="personId"
            render={({ field: { value, onChange } }) => (
              <FormItem>
                <FormLabel>Persona</FormLabel>
                <FormControl>
                  <DrawerSelector
                    items={personItems}
                    value={value ?? ""}
                    onChange={onChange}
                    renderItem={(item) => <span>{item.value}</span>}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {!isInterest && (
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
                    min={0}
                    step="0.01"
                    placeholder="0.00"
                    value={Number.isFinite(field.value) ? (field.value as number) : ""}
                    onChange={(event) =>
                      field.onChange(
                        Number.isNaN(event.target.valueAsNumber)
                          ? undefined
                          : event.target.valueAsNumber
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {isInterest && (
          <InterestTiersEditor
            tiers={tiers}
            balance={selectedAccount?.balance ?? 0}
            currency={selectedAccount?.currency}
            onChange={(next) =>
              form.setValue("interestTiers", next, { shouldValidate: true, shouldDirty: true })
            }
            error={
              Array.isArray(form.formState.errors.interestTiers)
                ? undefined
                : form.formState.errors.interestTiers?.message
            }
          />
        )}

        <FormField
          control={form.control}
          name="frequency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Frecuencia</FormLabel>
              <FormControl>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="grid grid-cols-3 gap-2"
                >
                  {(isInterest
                    ? frequencyOptions.filter((option) => option.value === "monthly")
                    : frequencyOptions
                  ).map((option) => (
                    <div
                      key={option.value}
                      onClick={() => !isInterest && field.onChange(option.value)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-md border p-2.5 transition-colors duration-200",
                        isInterest ? "cursor-not-allowed opacity-70" : "cursor-pointer",
                        field.value === option.value ? "border-primary bg-primary-100" : "border-border"
                      )}
                    >
                      <RadioGroupItem
                        value={option.value}
                        id={`recurring-frequency-${option.value}`}
                        disabled={isInterest}
                      />
                      <span className="text-sm">{option.label}</span>
                    </div>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="startDate"
          render={({ field: { value, onChange } }) => (
            <FormItem>
              <FormLabel>Fecha de inicio</FormLabel>
              <FormControl>
                <Popover open={startOpen} onOpenChange={setStartOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !value && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {value ? getDateString(value) : "Selecciona una fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={value}
                      onSelect={(date) => {
                        if (date) onChange(date);
                        setStartOpen(false);
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="endDate"
          render={({ field: { value, onChange } }) => (
            <FormItem>
              <FormLabel>Fecha de fin (opcional)</FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  <Popover open={endOpen} onOpenChange={setEndOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !value && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {value ? getDateString(value) : "Sin fecha"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={value}
                        onSelect={(date) => {
                          if (date) onChange(date);
                          setEndOpen(false);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  {value && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="cursor-pointer"
                      aria-label="Quitar fecha de fin"
                      onClick={() => onChange(undefined)}
                    >
                      <X />
                    </Button>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="active"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estado</FormLabel>
              <FormControl>
                <button
                  type="button"
                  aria-pressed={field.value}
                  onClick={() => field.onChange(!field.value)}
                  className={cn(
                    "flex h-11 w-full cursor-pointer items-center justify-between rounded-md border px-3 text-sm font-medium transition-colors duration-200",
                    field.value ? "border-primary bg-primary-100 text-primary-700" : "border-border"
                  )}
                >
                  <span>{field.value ? "Activa" : "Inactiva"}</span>
                  <span
                    className={cn(
                      "relative h-6 w-11 rounded-full transition-colors duration-200",
                      field.value ? "bg-primary" : "bg-muted"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform duration-200",
                        field.value ? "translate-x-5" : "translate-x-0.5"
                      )}
                    />
                  </span>
                </button>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col gap-2">
          {mutationError && (
            <p role="alert" className="text-sm text-destructive">
              {mutationError.message}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              className="cursor-pointer"
              onClick={onClose}
              disabled={recurringMutationLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" className="cursor-pointer" disabled={recurringMutationLoading}>
              {recurringMutationLoading && <LoaderCircle className="mr-2 animate-spin" />}
              {rule ? "Guardar" : "Crear regla"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}

export default RecurringRuleForm;
