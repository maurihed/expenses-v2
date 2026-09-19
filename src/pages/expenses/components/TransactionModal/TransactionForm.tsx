import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Calendar } from "@/components/ui/calendar";
import { CategoryIcon } from "@/components/ui/category-icon";
import { DialogFooter } from "@/components/ui/dialog";
import DrawerSelector from "@/components/ui/drawer-selector";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn, formatMoney, getDateString, parseDateOnly } from "@/lib/utils";
import { useExpensesStore } from "@/stores/expenses.store";
import { Categories, type Account, type Person, type Transaction } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftRight, CalendarIcon, LoaderCircle, Wallet } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAccounts } from "../../hooks/useAccounts";
import { useCategories } from "../../hooks/useCategories";
import { usePersons } from "../../hooks/usePersons";
import { useTransactions } from "../../hooks/useTransactions";
import { transactionFormSchema } from "../../schemas/transactionSchema";

type Props = {
  accountId: string | null;
  transactionToEdit: Transaction | null;
};

function TransactionForm({ accountId, transactionToEdit }: Props) {
  const [dateOpen, setDateOpen] = useState(false);
  const { accounts } = useAccounts(false);
  const { categories } = useCategories();
  const { newTransaction, editTransaction, mutationLoading, transactionMutationError } =
    useTransactions(false);
  const autoSelectElementRef = useRef<HTMLInputElement>(null);

  const closeModal = useExpensesStore((state) => state.closeTransactionModal);
  const isModalOpen = useExpensesStore((state) => state.transactionModalOpen);
  // Only load persons while the modal is open, mirroring the other gated hooks.
  const { persons } = usePersons(isModalOpen);

  const accountItems = accounts.map((account: Account) => ({
    key: account.id,
    value: account.name,
  }));

  const personItems = persons.map((person: Person) => ({
    key: person.id,
    value: person.name,
  }));

  const form = useForm<z.infer<typeof transactionFormSchema>>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      id: transactionToEdit?.id ?? "",
      type: transactionToEdit?.type ?? "expense",
      amount: transactionToEdit?.amount ?? 0,
      description: transactionToEdit?.description ?? "",
      date: transactionToEdit?.date ? parseDateOnly(transactionToEdit.date) : new Date(),
      category: transactionToEdit?.category ?? "",
      accountId: accountId ?? transactionToEdit?.accountId ?? "",
      scope: transactionToEdit?.scope ?? "joint",
      personId: transactionToEdit?.personId ?? "",
      toAccountId: transactionToEdit?.toAccountId ?? "",
      installments: transactionToEdit?.installments ?? null,
    },
  });

  const selectedCategory = form.watch("category");
  const selectedType = form.watch("type");
  const selectedScope = form.watch("scope");
  const selectedAccountId = form.watch("accountId");
  const selectedInstallments = form.watch("installments");
  const amountValue = form.watch("amount");

  const isTransfer = selectedType === "transfer";
  const isPersonal = selectedScope === "personal";

  const selectedAccount = useMemo(
    () => accounts.find((account: Account) => account.id === selectedAccountId),
    [accounts, selectedAccountId]
  );
  const showMsi = selectedType === "expense" && selectedAccount?.type === "CREDIT";

  const msiItems = useMemo(
    () => [
      { key: "1", value: "Normal (1 pago)" },
      ...Array.from({ length: 47 }, (_, index) => {
        const months = index + 2;
        return { key: String(months), value: `${months} meses` };
      }),
    ],
    []
  );

  const monthlyEstimate =
    showMsi && selectedInstallments != null && selectedInstallments >= 2 && amountValue > 0
      ? Math.round((amountValue / selectedInstallments) * 100) / 100
      : null;

  const categoryItems = useMemo(() => {
    const items = categories.map((category) => ({
      key: category.name,
      value: category.name,
    }));
    // Keep legacy transaction categories (not present in the API) selectable.
    if (selectedCategory && !items.some((item) => item.key === selectedCategory)) {
      items.unshift({ key: selectedCategory, value: selectedCategory });
    }
    return items;
  }, [categories, selectedCategory]);

  const destinationAccountItems = useMemo(
    () => accountItems.filter((item) => item.key !== selectedAccountId),
    [accountItems, selectedAccountId]
  );

  useEffect(() => {
    // Default to the first API category once they are loaded.
    if (!form.getValues("category") && categories.length > 0) {
      form.setValue("category", categories[0].name);
    }
  }, [categories, form]);

  useEffect(() => {
    // The destination account must never be the same as the source.
    if (isTransfer && form.getValues("toAccountId") === selectedAccountId) {
      form.setValue("toAccountId", "");
    }
  }, [isTransfer, selectedAccountId, form]);

  useEffect(() => {
    // Drop MSI when it no longer applies (other type or non-credit account).
    if (!showMsi && form.getValues("installments") != null) {
      form.setValue("installments", null);
    }
  }, [showMsi, form]);

  function onSubmit(values: z.infer<typeof transactionFormSchema>) {
    const installments =
      showMsi && values.installments != null && values.installments >= 2
        ? values.installments
        : null;

    const payload = {
      ...values,
      category: (values.category ?? "") as Categories,
      // On edit null clears the plan; on create we omit it when there is none.
      installments: transactionToEdit ? installments : installments ?? undefined,
    };

    if (transactionToEdit) {
      // Edit transaction
      editTransaction({
        transactionToEdit,
        transactionEdited: {
          ...payload,
          id: transactionToEdit.id,
        },
      });
    } else {
      // Create new transaction
      newTransaction({
        ...payload,
        id: "",
      });
    }
  }

  useEffect(() => {
    if (form.formState.isSubmitSuccessful && !mutationLoading && !transactionMutationError) {
      closeModal();
    }
  }, [form.formState.isSubmitSuccessful, mutationLoading, transactionMutationError, closeModal]);

  useEffect(() => {
    if (isModalOpen && autoSelectElementRef.current) {
      autoSelectElementRef.current.focus();
      autoSelectElementRef.current.select();
    }
  }, [isModalOpen]);

  const renderAccountItem = (item: { key: string; value: string }) => (
    <>
      <span className="bg-green-700 rounded-full p-2 flex items-center justify-center w-8 h-8">
        <Wallet size={24} />
      </span>
      <span>{item.value}</span>
    </>
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 flex flex-col">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex flex-wrap justify-end gap-2"
                >
                  <FormItem
                    className={cn([
                      "flex items-center border p-2 border-slate-200 rounded-sm cursor-pointer transition-colors duration-200",
                      {
                        "border-green-500": field.value === "income",
                      },
                    ])}
                  >
                    <FormControl>
                      <RadioGroupItem value="income" />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">Ingreso</FormLabel>
                  </FormItem>
                  <FormItem
                    className={cn([
                      "flex items-center border p-2 border-slate-200 rounded-sm cursor-pointer transition-colors duration-200",
                      {
                        "border-red-500": field.value === "expense",
                      },
                    ])}
                  >
                    <FormControl>
                      <RadioGroupItem value="expense" />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">Gasto</FormLabel>
                  </FormItem>
                  <FormItem
                    className={cn([
                      "flex items-center gap-1 border p-2 border-slate-200 rounded-sm cursor-pointer transition-colors duration-200",
                      {
                        "border-primary": field.value === "transfer",
                      },
                    ])}
                  >
                    <FormControl>
                      <RadioGroupItem value="transfer" />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">Transferencia</FormLabel>
                    <ArrowLeftRight className="h-4 w-4" />
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="scope"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Alcance</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex flex-wrap gap-2"
                >
                  <FormItem
                    className={cn([
                      "flex items-center gap-1 border p-2 border-slate-200 rounded-sm cursor-pointer transition-colors duration-200",
                      {
                        "border-primary": field.value === "joint",
                      },
                    ])}
                  >
                    <FormControl>
                      <RadioGroupItem value="joint" />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">Conjunto</FormLabel>
                  </FormItem>
                  <FormItem
                    className={cn([
                      "flex items-center gap-1 border p-2 border-slate-200 rounded-sm cursor-pointer transition-colors duration-200",
                      {
                        "border-primary": field.value === "personal",
                      },
                    ])}
                  >
                    <FormControl>
                      <RadioGroupItem value="personal" />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">Personal</FormLabel>
                  </FormItem>
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
                    renderItem={(item) => (
                      <>
                        <span className="bg-primary-100 text-primary-700 rounded-full flex items-center justify-center w-8 h-8 font-semibold">
                          {item.value.charAt(0).toUpperCase()}
                        </span>
                        <span>{item.value}</span>
                      </>
                    )}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cantidad</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  max={5000_000}
                  {...field}
                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  ref={autoSelectElementRef}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripcion</FormLabel>
              <FormControl>
                <Input required {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field: { value, onChange } }) => (
            <FormItem>
              <FormLabel>Fecha</FormLabel>
              <FormControl>
                <Popover open={dateOpen} onOpenChange={setDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !value && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {value ? getDateString(value) : <span>Selecciona una fecha</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={value}
                      onSelect={(e) => {
                        onChange(e);
                        setDateOpen(false);
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
          name="accountId"
          render={({ field: { value, onChange } }) => (
            <FormItem>
              <FormLabel>{isTransfer ? "Cuenta origen" : "Cuenta"}</FormLabel>
              <FormControl>
                <DrawerSelector
                  items={accountItems}
                  value={value}
                  onChange={onChange}
                  renderItem={renderAccountItem}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {showMsi && (
          <FormField
            control={form.control}
            name="installments"
            render={({ field: { value, onChange } }) => (
              <FormItem>
                <FormLabel>Meses sin intereses</FormLabel>
                <FormControl>
                  <DrawerSelector
                    items={msiItems}
                    value={value != null && value >= 2 ? String(value) : "1"}
                    onChange={(next) => {
                      const months = Number(next);
                      onChange(months >= 2 ? months : null);
                    }}
                    renderItem={(item) => <span>{item.value}</span>}
                  />
                </FormControl>
                <FormMessage />
                {monthlyEstimate != null && (
                  <p className="text-xs text-muted-foreground">
                    Mensualidad estimada:{" "}
                    <span className="font-semibold tabular-nums">
                      {formatMoney(monthlyEstimate, selectedAccount?.currency ?? "MXN")}
                    </span>
                  </p>
                )}
              </FormItem>
            )}
          />
        )}

        {isTransfer && (
          <FormField
            control={form.control}
            name="toAccountId"
            render={({ field: { value, onChange } }) => (
              <FormItem>
                <FormLabel>Cuenta destino</FormLabel>
                <FormControl>
                  <DrawerSelector
                    items={destinationAccountItems}
                    value={value ?? ""}
                    onChange={onChange}
                    renderItem={renderAccountItem}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {!isTransfer && (
          <FormField
            control={form.control}
            name="category"
            render={({ field: { value, onChange } }) => (
              <FormItem>
                <FormLabel>Categoria</FormLabel>
                <FormControl>
                  <DrawerSelector
                    items={categoryItems}
                    value={value ?? ""}
                    onChange={onChange}
                    renderItem={(item) => {
                      const category = categories.find((option) => option.name === item.key);
                      return (
                        <>
                          <CategoryIcon
                            category={item.key}
                            icon={category?.icon}
                            color={category?.color}
                            size="md"
                          />
                          <span>{item.value}</span>
                        </>
                      );
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <DialogFooter className="mt-auto">
          <div className="flex flex-col gap-2">
            {transactionMutationError && (
              <p role="alert" className="text-sm text-destructive">
                {transactionMutationError.message}
              </p>
            )}
            <div className="flex justify-end gap-4">
              <Button
                variant="secondary"
                type="button"
                onClick={() => {
                  form.reset();
                  closeModal();
                }}
                disabled={mutationLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-primary" disabled={mutationLoading}>
                {mutationLoading && <LoaderCircle className="animate-spin mr-2" />}
                {transactionToEdit ? "Actualizar" : "Crear"}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </form>
    </Form>
  );
}

export default TransactionForm;
