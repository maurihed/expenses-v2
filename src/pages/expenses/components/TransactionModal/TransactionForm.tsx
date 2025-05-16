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
import { cn, getDateString } from "@/lib/utils";
import { useExpensesStore } from "@/stores/expenses.store";
import { Categories, type Account, type Transaction } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, LoaderCircle, Wallet } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAccounts } from "../../hooks/useAccounts";
import { useTransactions } from "../../hooks/useTransactions";
import { transactionFormSchema } from "../../schemas/transactionSchema";

type Props = {
  accountId: string | null;
  transactionToEdit: Transaction | null;
};

const cactegoryItems = Object.values(Categories).map((_category) => {
  return {
    key: _category,
    value: _category,
  };
});

function TransactionForm({ accountId, transactionToEdit }: Props) {
  const [dateOpen, setDateOpen] = useState(false);
  const { accounts } = useAccounts(false);
  const { newTransaction, editTransaction, mutationLoading, isDeleting } =
    useTransactions(false);
  const autoSelectElementRef = useRef<HTMLInputElement>(null);

  const closeModal = useExpensesStore((state) => state.closeTransactionModal);
  const isModalOpen = useExpensesStore((state) => state.transactionModalOpen);

  const accountItems = accounts.map((account: Account) => ({
    key: account.id,
    value: account.name,
  }));

  const form = useForm<z.infer<typeof transactionFormSchema>>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      id: transactionToEdit?.id ?? "",
      type: transactionToEdit?.type ?? "expense",
      amount: transactionToEdit?.amount ?? 0,
      description: transactionToEdit?.description ?? "",
      date: transactionToEdit?.date ? new Date(transactionToEdit.date) : new Date(),
      category: transactionToEdit?.category ?? "",
      accountId: accountId ?? transactionToEdit?.accountId ?? "",
    },
  });

  function onSubmit(values: z.infer<typeof transactionFormSchema>) {
    if (transactionToEdit) {
      // Edit transaction
      editTransaction({
        transactionToEdit,
        transactionEdited: {
          ...values,
          id: transactionToEdit.id,
          category: values.category as Categories,
        },
      });
    } else {
      // Create new transaction
      newTransaction({
        ...values,
        id: "",
        category: values.category as Categories,
      });
    }
  }

  useEffect(() => {
    if (form.formState.isSubmitSuccessful && !mutationLoading) {
      closeModal();
    }
  }, [form.formState.isSubmitSuccessful, mutationLoading]);

  useEffect(() => {
    if (isModalOpen && autoSelectElementRef.current) {
      autoSelectElementRef.current.focus();
      autoSelectElementRef.current.select();
    }
  }, [isModalOpen]);

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
                  defaultValue={field.value}
                  className="flex justify-end"
                >
                  <FormItem
                    className={cn([
                      "flex items-center border p-2 border-slate-200 rounded-sm",
                      {
                        "border-green-500": field.value === "income",
                      },
                    ])}
                  >
                    <FormControl>
                      <RadioGroupItem value="income" />
                    </FormControl>
                    <FormLabel className="font-normal">Ingreso</FormLabel>
                  </FormItem>
                  <FormItem
                    className={cn([
                      "flex items-center border p-2 border-slate-200 rounded-sm",
                      {
                        "border-red-500": field.value === "expense",
                      },
                    ])}
                  >
                    <FormControl>
                      <RadioGroupItem value="expense" />
                    </FormControl>
                    <FormLabel className="font-normal">Gasto</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
              <FormLabel>Descripcion</FormLabel>
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
          name="category"
          render={({ field: { value, onChange } }) => (
            <FormItem>
              <FormLabel>Categoria</FormLabel>
              <FormControl>
                <DrawerSelector
                  items={cactegoryItems}
                  value={value}
                  onChange={onChange}
                  renderItem={(item) => (
                    <>
                      <CategoryIcon category={item.key as Categories} size="md" />
                      <span>{item.value}</span>
                    </>
                  )}
                />
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
                  renderItem={(item) => (
                    <>
                      <span className="bg-green-700 rounded-full p-2 flex items-center justify-center w-8 h-8">
                        <Wallet size={24} />
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
        <DialogFooter className="mt-auto">
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
        </DialogFooter>
      </form>
    </Form>
  );
}

export default TransactionForm;
