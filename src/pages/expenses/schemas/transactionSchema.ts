import { z } from "zod";

export const transactionFormSchema = z.object({
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
  category: z.string({ required_error: "La categoria es obligatoria" }).min(1).max(50),
  accountId: z.string().min(1).max(50),
  type: z.enum(["income", "expense"], {
    required_error: "El tipo de transaccion es obligatorio",
  }),
});
