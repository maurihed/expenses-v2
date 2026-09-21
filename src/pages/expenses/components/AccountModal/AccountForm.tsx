import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import type { Account, AccountPayload, AccountType, Currency } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAccountMutations } from "../../hooks/useAccounts";

const typeOptions: { value: AccountType; label: string }[] = [
  { value: "CASH", label: "Efectivo" },
  { value: "DEBIT", label: "Débito" },
  { value: "CREDIT", label: "Crédito" },
  { value: "INVESTMENT", label: "Inversión" },
];

const currencyOptions: Currency[] = ["MXN", "USD"];

const accountFormSchema = z
  .object({
    name: z
      .string({ required_error: "El nombre es obligatorio" })
      .min(1, "El nombre es obligatorio")
      .max(100),
    type: z.enum(["CASH", "DEBIT", "CREDIT", "INVESTMENT"], {
      required_error: "El tipo es obligatorio",
    }),
    currency: z.enum(["MXN", "USD"], {
      required_error: "La moneda es obligatoria",
    }),
    balance: z.number({ invalid_type_error: "Ingresa un número" }),
    initialDebt: z
      .number({ invalid_type_error: "Ingresa un número" })
      .nonnegative("No puede ser negativo")
      .optional(),
    creditLimit: z.number({ invalid_type_error: "Ingresa un número" }).nonnegative().optional(),
    statementClosingDay: z
      .number({ invalid_type_error: "Ingresa un número" })
      .int()
      .min(1, "Entre 1 y 31")
      .max(31, "Entre 1 y 31")
      .optional(),
    paymentDueDay: z
      .number({ invalid_type_error: "Ingresa un número" })
      .int()
      .min(1, "Entre 1 y 31")
      .max(31, "Entre 1 y 31")
      .optional(),
  })
  .superRefine((values, ctx) => {
    if (values.type !== "CREDIT") return;
    if (values.creditLimit === undefined) {
      ctx.addIssue({ path: ["creditLimit"], code: z.ZodIssueCode.custom, message: "Requerido" });
    }
    if (values.statementClosingDay === undefined) {
      ctx.addIssue({
        path: ["statementClosingDay"],
        code: z.ZodIssueCode.custom,
        message: "Requerido",
      });
    }
    if (values.paymentDueDay === undefined) {
      ctx.addIssue({ path: ["paymentDueDay"], code: z.ZodIssueCode.custom, message: "Requerido" });
    }
  });

type AccountFormValues = z.infer<typeof accountFormSchema>;

type Props = {
  account: Account | null;
  onClose: () => void;
  onArchived: () => void;
};

function AccountForm({ account, onClose, onArchived }: Props) {
  const [confirmArchive, setConfirmArchive] = useState(false);
  const { createAccount, updateAccount, archiveAccount, accountMutationLoading } =
    useAccountMutations();

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      name: account?.name ?? "",
      type: account?.type ?? "CASH",
      currency: account?.currency ?? "MXN",
      balance: account?.balance ?? 0,
      initialDebt: account?.initialDebt ?? account?.balance ?? 0,
      creditLimit: account?.creditLimit ?? undefined,
      statementClosingDay: account?.statementClosingDay ?? undefined,
      paymentDueDay: account?.paymentDueDay ?? undefined,
    },
  });

  const selectedType = form.watch("type");
  const isCredit = selectedType === "CREDIT";
  const mutationError = createAccount.error ?? updateAccount.error ?? archiveAccount.error;

  function onSubmit(values: AccountFormValues) {
    const payload: AccountPayload = {
      name: values.name,
      type: values.type,
      currency: values.currency,
    };
    if (values.type === "CREDIT") {
      payload.creditLimit = values.creditLimit;
      payload.statementClosingDay = values.statementClosingDay;
      payload.paymentDueDay = values.paymentDueDay;
      // La deuda inicial fija el saldo de la tarjeta; solo se envía al crear o
      // si el usuario la cambió, para no reiniciar el saldo en ediciones.
      if (!account || form.formState.dirtyFields.initialDebt) {
        payload.initialDebt = values.initialDebt ?? 0;
      }
    } else {
      payload.balance = values.balance;
    }

    if (account) {
      updateAccount.mutate(
        { id: account.id, account: payload },
        { onSuccess: () => onClose() }
      );
    } else {
      createAccount.mutate(payload, { onSuccess: () => onClose() });
    }
  }

  const handleArchive = () => {
    if (!account) return;
    archiveAccount.mutate(account.id, { onSuccess: () => onArchived() });
  };

  useEffect(() => {
    form.clearErrors(["creditLimit", "statementClosingDay", "paymentDueDay"]);
  }, [form, selectedType]);

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
                <Input placeholder="Ej. Tarjeta BBVA" {...field} />
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
                    <label
                      key={option.value}
                      htmlFor={`account-type-${option.value}`}
                      className={cn(
                        "flex items-center gap-2 rounded-md border p-3 cursor-pointer transition-colors duration-200",
                        field.value === option.value
                          ? "border-primary bg-primary-100 text-primary-700 dark:bg-primary-500/20 dark:text-primary-100"
                          : "border-border"
                      )}
                    >
                      <RadioGroupItem value={option.value} id={`account-type-${option.value}`} />
                      <span className="text-sm">{option.label}</span>
                    </label>
                  ))}
                </RadioGroup>
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
                  value={field.value}
                  onValueChange={field.onChange}
                  className="flex gap-2"
                >
                  {currencyOptions.map((currency) => (
                    <label
                      key={currency}
                      htmlFor={`account-currency-${currency}`}
                      className={cn(
                        "flex flex-1 items-center gap-2 rounded-md border p-3 cursor-pointer transition-colors duration-200",
                        field.value === currency
                          ? "border-primary bg-primary-100 text-primary-700 dark:bg-primary-500/20 dark:text-primary-100"
                          : "border-border"
                      )}
                    >
                      <RadioGroupItem value={currency} id={`account-currency-${currency}`} />
                      <span className="text-sm">{currency}</span>
                    </label>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {isCredit ? (
          <FormField
            control={form.control}
            name="initialDebt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Deuda inicial a pagar en corte</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    {...field}
                    value={Number.isFinite(field.value) ? field.value : ""}
                    onChange={(event) =>
                      field.onChange(
                        event.target.value === "" ? undefined : event.target.valueAsNumber
                      )
                    }
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground">
                  Es el saldo con el que arranca la tarjeta y cuenta en el pago del corte actual.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <FormField
            control={form.control}
            name="balance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{account ? "Saldo actual" : "Saldo inicial"}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    {...field}
                    value={Number.isFinite(field.value) ? field.value : ""}
                    onChange={(event) =>
                      field.onChange(
                        event.target.value === "" ? 0 : event.target.valueAsNumber
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {isCredit && (
          <>
            <FormField
              control={form.control}
              name="creditLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Línea de crédito</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(event) =>
                        field.onChange(
                          event.target.value === "" ? undefined : event.target.valueAsNumber
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="statementClosingDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Día de corte</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={31}
                        {...field}
                        value={field.value ?? ""}
                        onChange={(event) =>
                          field.onChange(
                            event.target.value === "" ? undefined : event.target.valueAsNumber
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paymentDueDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Día de pago</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={31}
                        {...field}
                        value={field.value ?? ""}
                        onChange={(event) =>
                          field.onChange(
                            event.target.value === "" ? undefined : event.target.valueAsNumber
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </>
        )}

        <div className="flex flex-col gap-2">
          {mutationError && (
            <p role="alert" className="text-sm text-destructive">
              {mutationError.message}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose} disabled={accountMutationLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={accountMutationLoading}>
              {accountMutationLoading && <LoaderCircle className="animate-spin mr-2" />}
              {account ? "Guardar" : "Crear cuenta"}
            </Button>
          </div>
          {account &&
            (confirmArchive ? (
              <div className="flex flex-col gap-2 rounded-md border border-destructive/40 p-3">
                <p className="text-sm">¿Archivar esta cuenta? Dejará de aparecer en la lista.</p>
                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setConfirmArchive(false)}
                    disabled={archiveAccount.isLoading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleArchive}
                    disabled={archiveAccount.isLoading}
                  >
                    {archiveAccount.isLoading && <LoaderCircle className="animate-spin mr-2" />}
                    Sí, archivar
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => setConfirmArchive(true)}
                disabled={accountMutationLoading}
              >
                Archivar cuenta
              </Button>
            ))}
        </div>
      </form>
    </Form>
  );
}

export default AccountForm;
