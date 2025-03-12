import { z } from "zod";
import type { Payment as BasePayment } from "@/components/payments/types";

export type { Payment } from "@/components/payments/types";

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
  payment_method_code: z.enum(["cc", "check", "transfer", "cash"], {
    required_error: "Payment method is required",
  }),
  payment_date: z.string().min(1, "Payment date is required"),
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a positive number",
  }),
  notes: z.string().optional()
});

export type ExpenseFormStage1Data = z.infer<typeof expenseFormStage1Schema>;
export type PaymentDetailsData = z.infer<typeof paymentDetailsSchema>;

// More flexible Expense interface that handles potential database inconsistencies
export interface Expense {
  id: string;
  project_id: string;
  // contractor_id is being phased out in favor of gc_account_id
  contractor_id?: string;
  gc_account_id?: string;
  client_id?: string;
  name: string;
  payee: string;
  amount: number;
  amount_due?: number;
  expense_date: string;
  expense_type?: "labor" | "materials" | "subcontractor" | "other";
  payment_status?: "due" | "partially_paid" | "paid";
  expense_number?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  payments?: BasePayment[];
  project?: { 
    name?: string;
    [key: string]: any;
  };
  [key: string]: any; // Allow for any additional properties
}

// A more permissive version of the Expense type for database results
export interface DatabaseExpense {
  id: string;
  project_id?: string;
  gc_account_id?: string;
  contractor_id?: string;
  name?: string;
  payee?: string;
  amount?: number;
  amount_due?: number;
  expense_date?: string;
  expense_type?: string;
  payment_status?: string;
  expense_number?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  payments?: any[];
  project?: { 
    name?: string;
    [key: string]: any;
  };
  _originalData?: any; // For debugging purposes
  [key: string]: any; // Allow for any additional properties from the database
}
