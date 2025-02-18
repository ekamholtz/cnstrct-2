
import { z } from "zod";

export const expenseFormStage1Schema = z.object({
  name: z.string().min(1, "Expense description is required"),
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a positive number",
  }),
  payee: z.string().min(1, "Payee name is required"),
  expense_date: z.string().min(1, "Date is required"),
  expense_type: z.enum(["labor", "materials", "subcontractor", "other"], {
    required_error: "Expense type is required",
  }),
  project_id: z.string().min(1, "Project is required"),
  notes: z.string().optional(),
});

export type ExpenseFormStage1Data = z.infer<typeof expenseFormStage1Schema>;

export interface Expense {
  id: string;
  project_id: string;
  name: string;
  payee: string;
  amount: number;
  expense_date: string;
  expense_type: "labor" | "materials" | "subcontractor" | "other";
  payment_status: "due" | "paid" | "failed";
  notes?: string;
  created_at: string;
}
