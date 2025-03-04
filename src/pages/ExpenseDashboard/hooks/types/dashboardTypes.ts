
import { ExpenseFilters } from "../../types";
import { ExpenseFormStage1Data, PaymentDetailsData } from "@/components/project/expense/types";

export type CreateExpenseFunction = (
  data: ExpenseFormStage1Data,
  status: 'due' | 'paid' | 'partially_paid',
  paymentDetails?: PaymentDetailsData
) => Promise<void>;

export interface UseExpenseDashboardResult {
  filters: ExpenseFilters;
  setFilters: React.Dispatch<React.SetStateAction<ExpenseFilters>>;
  expenses: any[] | null;
  isLoading: boolean;
  handleCreateExpense: CreateExpenseFunction;
}
