
import { useState } from "react";
import { useCurrentUserProfile } from "@/components/gc-profile/hooks/useCurrentUserProfile";
import { useFetchExpenses } from "./useFetchExpenses";
import { useCreateExpenseDashboard } from "./useCreateExpenseDashboard";
import { useProcessPaymentDashboard } from "./useProcessPaymentDashboard";
import { ExpenseFilters } from "../types";
import { ProcessPaymentMutation, CreateExpenseFunction } from "./types";

export interface UseExpenseDashboardResult {
  filters: ExpenseFilters;
  setFilters: React.Dispatch<React.SetStateAction<ExpenseFilters>>;
  expenses: any[] | null;
  isLoading: boolean;
  handleCreateExpense: CreateExpenseFunction;
  processPaymentMutation: ProcessPaymentMutation;
}

export function useExpenseDashboard(): UseExpenseDashboardResult {
  const [filters, setFilters] = useState<ExpenseFilters>({
    dateRange: undefined,
    status: "all",
    projectId: "all",
    expenseType: "all"
  });

  const { currentUserProfile } = useCurrentUserProfile();
  const { data: expenses, isLoading } = useFetchExpenses(filters);
  const { handleCreateExpense } = useCreateExpenseDashboard();
  const { processPaymentMutation } = useProcessPaymentDashboard();

  return {
    filters,
    setFilters,
    expenses,
    isLoading,
    handleCreateExpense,
    processPaymentMutation,
  };
}
