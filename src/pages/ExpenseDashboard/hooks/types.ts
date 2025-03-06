
import { UseMutationResult } from "@tanstack/react-query";
import { ExpenseFormStage1Data, PaymentDetailsData } from "@/components/project/expense/types";

export interface ProcessPaymentParams {
  expenseId: string;
  amount: number;
  paymentDetails: {
    payment_method_code: string;
    payment_date: string;
    amount: number;
    notes?: string;
  };
  expensesTable: 'expenses' | 'homeowner_expenses';
}

export interface PaymentResponse {
  id: string;
  expense_id: string;
  payment_method_code: string;
  payment_date: string;
  amount: number;
  notes?: string;
  created_at: string;
}

export type ProcessPaymentMutation = UseMutationResult<
  PaymentResponse,
  Error,
  ProcessPaymentParams,
  unknown
>;

export type CreateExpenseFunction = (
  data: ExpenseFormStage1Data,
  status: 'due' | 'paid' | 'partially_paid',
  paymentDetails?: PaymentDetailsData
) => Promise<void>;
