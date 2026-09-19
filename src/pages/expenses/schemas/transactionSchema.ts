import { z } from "zod";

export const transactionFormSchema = z
  .object({
    id: z.string().optional(),
    amount: z
      .number({
        required_error: "La cantidad es obligatoria",
        invalid_type_error: "La cantidad debe de ser un numero",
      })
      .transform((val) => Number(val))
      .refine((val) => val > 0, {
        message: "La cantidad debe de ser mayor a 0",
      }),
    description: z.string({ required_error: "La descripcion es obligatoria" }).min(1).max(250),
    date: z.date({
      invalid_type_error: "La fecha no es valida",
      required_error: "La fecha es obligatoria",
    }),
    // Category is required for income/expense and ignored for transfers.
    category: z.string().max(50).optional(),
    accountId: z.string().min(1).max(50),
    type: z.enum(["income", "expense", "transfer"], {
      required_error: "El tipo de transaccion es obligatorio",
    }),
    scope: z.enum(["joint", "personal"]),
    personId: z.string().optional(),
    toAccountId: z.string().optional(),
    // Only meaningful for expenses on a CREDIT account; the form hides it otherwise.
    installments: z
      .number({ invalid_type_error: "Los meses deben de ser un numero" })
      .int("Los meses deben de ser un numero entero")
      .min(2, "El minimo es 2 meses")
      .max(48, "El maximo es 48 meses")
      .nullable()
      .optional(),
  })
  .superRefine((values, ctx) => {
    if (values.installments != null && values.type !== "expense") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["installments"],
        message: "Los meses sin intereses solo aplican a gastos",
      });
    }

    if (values.type !== "transfer" && !values.category) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["category"],
        message: "La categoria es obligatoria",
      });
    }

    if (values.type === "transfer") {
      if (!values.toAccountId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["toAccountId"],
          message: "La cuenta destino es obligatoria",
        });
      } else if (values.toAccountId === values.accountId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["toAccountId"],
          message: "La cuenta destino debe de ser diferente a la cuenta origen",
        });
      }
    }

    if (values.scope === "personal" && !values.personId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["personId"],
        message: "La persona es obligatoria",
      });
    }
  });
