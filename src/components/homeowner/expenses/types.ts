
import { Database } from "@/integrations/supabase/types";

export type HomeownerExpense = Database["public"]["Tables"]["homeowner_expenses"]["Row"];

export interface HomeownerExpenseFormData {
  name: string;
  amount: string;
  payee: string;
  expense_date: string;
  expense_type: Database["public"]["Enums"]["homeowner_expense_type"];
  notes?: string;
  project_id: string;
}

export interface PaymentDetailsData {
  payment_method_code: string;
  payment_date: string;
  amount: number;
  notes?: string;
}
