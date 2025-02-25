
import { Database } from "@/integrations/supabase/types";

export type HomeownerExpense = Database["public"]["Tables"]["homeowner_expenses"]["Row"];

export type HomeownerExpenseFormFields = {
  name: string;
  amount: string;
  payee: string;
  expense_date: string;
  expense_type: Database["public"]["Enums"]["homeowner_expense_type"];
  notes?: string;
  project_id: string;
}

export type PaymentMethodCode = "cc" | "check" | "transfer" | "cash";

export type PaymentDetailsData = {
  payment_method_code: PaymentMethodCode;
  payment_date: string;
  amount: number;
  notes?: string;
}
