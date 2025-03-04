
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ExpenseFilters } from "../types";
import type { ExpenseFormStage1Data, PaymentDetailsData } from "@/components/project/expense/types";
import { useCurrentUserProfile } from "@/components/gc-profile/hooks/useCurrentUserProfile";

const generateExpenseNumber = () => {
  return `EXP-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`.toUpperCase();
};

export function useExpenseDashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentUserProfile } = useCurrentUserProfile();
  const [filters, setFilters] = useState<ExpenseFilters>({
    dateRange: undefined,
    status: "all",
    projectId: "all",
    expenseType: "all"
  });

  // Determine if the current user is a homeowner
  const isHomeowner = currentUserProfile?.role === 'homeowner';
  const expensesTable = isHomeowner ? 'homeowner_expenses' : 'expenses';

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expenses', filters, expensesTable],
    queryFn: async () => {
      console.log(`Fetching expenses from ${expensesTable} table with filters:`, filters);
      
      // Use standard Supabase join pattern without table aliases
      let query = supabase
        .from(expensesTable)
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
      if (error) {
        console.error(`Error fetching expenses from ${expensesTable}:`, error);
        throw error;
      }
      
      console.log(`Fetched ${data?.length || 0} expenses from ${expensesTable}:`, data);
      return data;
    },
    enabled: !!currentUserProfile,
  });

  const handleCreateExpense = async (
    data: ExpenseFormStage1Data,
    status: 'due' | 'paid' | 'partially_paid',
    paymentDetails?: PaymentDetailsData
  ): Promise<void> => {
    try {
      console.log('Attempting to create expense with data:', data);
      console.log('User role:', currentUserProfile?.role);
      console.log('Using table:', expensesTable);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const amount = parseFloat(data.amount);
      const expenseNumber = generateExpenseNumber();
      
      console.log('Creating expense with amount:', amount, 'and expense number:', expenseNumber);
      
      let newExpense;
      
      if (isHomeowner) {
        // Homeowner flow - save to homeowner_expenses
        const { data: homeownerExpense, error } = await supabase
          .from('homeowner_expenses')
          .insert({
            name: data.name,
            amount: amount,
            amount_due: amount,
            payee: data.payee,
            expense_date: data.expense_date,
            expense_type: data.expense_type,
            project_id: data.project_id,
            notes: data.notes,
            homeowner_id: user.id,
            payment_status: status,
            expense_number: expenseNumber
          })
          .select()
          .single();

        if (error) {
          console.error('Error during homeowner expense creation:', error);
          throw error;
        }
        
        newExpense = homeownerExpense;
        console.log('Homeowner expense created successfully:', newExpense);
      } else {
        // GC or Project Manager flow - save to expenses
        const { data: gcExpense, error } = await supabase
          .from('expenses')
          .insert({
            name: data.name,
            amount: amount,
            amount_due: amount,
            payee: data.payee,
            expense_date: data.expense_date,
            expense_type: data.expense_type,
            project_id: data.project_id,
            notes: data.notes,
            payment_status: status,
            expense_number: expenseNumber
          })
          .select()
          .single();

        if (error) {
          console.error('Error during expense creation:', error);
          throw error;
        }
        
        newExpense = gcExpense;
        console.log('GC/PM expense created successfully:', newExpense);
      }

      // If payment details are provided, create a payment
      if (paymentDetails && newExpense) {
        console.log('Creating payment for expense:', newExpense.id, paymentDetails);
        const paymentAmount = parseFloat(paymentDetails.amount);
        
        const { data: payment, error: paymentError } = await supabase
          .from('payments')
          .insert({
            expense_id: newExpense.id,
            payment_method_code: paymentDetails.payment_method_code,
            payment_date: paymentDetails.payment_date,
            amount: paymentAmount,
            notes: paymentDetails.notes || '',
            direction: 'outgoing',
            status: 'completed'
          })
          .select();

        if (paymentError) {
          console.error('Error creating payment:', paymentError);
          throw paymentError;
        }
        
        console.log('Payment created successfully:', payment);
        
        // Update expense amount_due and status based on payment
        const newAmountDue = newExpense.amount - paymentAmount;
        const newStatus = newAmountDue <= 0 ? 'paid' as const : 'partially_paid' as const;
        
        const { error: updateError } = await supabase
          .from(expensesTable)
          .update({
            payment_status: newStatus,
            amount_due: Math.max(0, newAmountDue)
          })
          .eq('id', newExpense.id);
          
        if (updateError) {
          console.error(`Error updating expense after payment:`, updateError);
        }
      }

      // Invalidate both the expenses list and the project-specific queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['expenses'] }),
        queryClient.invalidateQueries({ queryKey: ['project', data.project_id] }),
        queryClient.invalidateQueries({ queryKey: ['homeowner-expenses', data.project_id] }),
        queryClient.invalidateQueries({ queryKey: ['expenses', data.project_id] })
      ]);

      toast({
        title: "Success",
        description: "Expense created successfully" + (paymentDetails ? " with payment" : ""),
      });
    } catch (error) {
      console.error('Error creating expense:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create expense. Please try again.",
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
