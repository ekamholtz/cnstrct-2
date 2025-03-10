import { ExpenseFilters } from "../../types";
import { ExpenseFormStage1Data, PaymentDetailsData } from "@/components/project/expense/types";
import { UseMutationResult } from "@tanstack/react-query";

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
  processPaymentMutation: UseMutationResult<any, Error, {
    expenseId: string;
    amount: number;
    paymentDetails: {
      payment_method_code: string;
      payment_date: string;
      amount: number;
      notes?: string;
    };
    expensesTable?: 'expenses' | 'homeowner_expenses';
  }>;
}
