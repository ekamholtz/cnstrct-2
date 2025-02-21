
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

export const paymentDetailsSchema = z.object({
  payment_type: z.enum(["cc", "check", "transfer", "cash"], {
    required_error: "Payment type is required",
  }),
  payment_date: z.string().min(1, "Payment date is required"),
  payment_amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Payment amount must be a positive number",
  }),
  vendor_email: z.string().email("Invalid email").optional(),
  vendor_phone: z.string().optional(),
});

export type ExpenseFormStage1Data = z.infer<typeof expenseFormStage1Schema>;
export type PaymentDetailsData = z.infer<typeof paymentDetailsSchema>;

export interface Expense {
  id: string;
  project_id: string;
  contractor_id: string;
  name: string;
  payee: string;
  amount: number;
  amount_due?: number; // Made optional
  expense_date: string;
  expense_type: "labor" | "materials" | "subcontractor" | "other";
  payment_status: "due" | "partially_paid" | "paid";
  notes?: string;
  created_at: string;
  updated_at: string;
  payments?: Payment[];
}

export interface Payment {
  id: string;
  expense_id: string;
  payment_type: "cc" | "check" | "transfer" | "cash";
  payment_date: string;
  payment_amount: number;
  vendor_email?: string | null;
  vendor_phone?: string | null;
  simulation_data?: any;
  created_at: string;
  updated_at: string;
}
