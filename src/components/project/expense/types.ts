
import { z } from "zod";

export const expenseFormSchema = z.object({
  name: z.string().min(1, "Expense name is required"),
  payee: z.string().min(1, "Payee name is required"),
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a positive number",
  }),
  expense_date: z.date(),
  payment_type: z.enum(["cc", "check", "transfer", "cash"]),
  notes: z.string().optional(),
});

export type ExpenseFormData = z.infer<typeof expenseFormSchema>;

export interface Expense {
  id: string;
  project_id: string;
  name: string;
  payee: string;
  amount: number;
  expense_date: string;
  payment_type: "cc" | "check" | "transfer" | "cash";
  notes?: string;
  created_at: string;
}
