
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ExpenseFilters } from "../types";
import type { ExpenseFormStage1Data, PaymentDetailsData } from "@/components/project/expense/types";

const generateExpenseNumber = () => {
  return `EXP-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`.toUpperCase();
};

export function useExpenseDashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [filters, setFilters] = useState<ExpenseFilters>({
    dateRange: undefined,
    status: "all",
    projectId: "all",
    expenseType: "all"
  });

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expenses', filters],
    queryFn: async () => {
      // Use standard Supabase join pattern without table aliases
      let query = supabase
        .from('homeowner_expenses')
        .select(`
          *,
          project:project_id (
            name
          )
        `);

      if (filters.status !== 'all') {
        query = query.eq('payment_status', filters.status);
      }
      if (filters.projectId !== 'all') {
        query = query.eq('project_id', filters.projectId);
      }
      if (filters.expenseType !== 'all') {
        query = query.eq('expense_type', filters.expenseType);
      }
      if (filters.dateRange?.from) {
        query = query.gte('expense_date', filters.dateRange.from.toISOString());
      }
      if (filters.dateRange?.to) {
        query = query.lte('expense_date', filters.dateRange.to.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const handleCreateExpense = async (
    data: ExpenseFormStage1Data,
    status: 'due' | 'paid' | 'partially_paid',
    paymentDetails?: PaymentDetailsData
  ): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { error } = await supabase
        .from('homeowner_expenses')
        .insert({
          name: data.name,
          amount: parseFloat(data.amount),
          payee: data.payee,
          expense_date: data.expense_date,
          expense_type: data.expense_type,
          project_id: data.project_id,
          notes: data.notes,
          homeowner_id: user.id,
          payment_status: status,
          amount_due: parseFloat(data.amount),
          expense_number: generateExpenseNumber()
        });

      if (error) throw error;

      // Invalidate both the expenses list and the project-specific queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['expenses'] }),
        queryClient.invalidateQueries({ queryKey: ['project', data.project_id] }),
        queryClient.invalidateQueries({ queryKey: ['homeowner-expenses', data.project_id] })
      ]);

      toast({
        title: "Success",
        description: "Expense created successfully",
      });
    } catch (error) {
      console.error('Error creating expense:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create expense. Please try again.",
      });
      throw error;
    }
  };

  return {
    filters,
    setFilters,
    expenses,
    isLoading,
    handleCreateExpense,
  };
}
