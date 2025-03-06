
import { useState } from "react";
import { useCurrentUserProfile } from "@/components/gc-profile/hooks/useCurrentUserProfile";
import { useFetchExpenses } from "./useFetchExpenses";
import { useCreateExpenseDashboard } from "./useCreateExpenseDashboard";
import { useProcessPaymentDashboard } from "./useProcessPaymentDashboard";
import { ExpenseFilters } from "../types";

export function useExpenseDashboard() {
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
