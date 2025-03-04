
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ExpenseFilters } from "../types";
import { useCurrentUserProfile } from "@/components/gc-profile/hooks/useCurrentUserProfile";

export function useFetchExpenses(filters: ExpenseFilters) {
  const { currentUserProfile } = useCurrentUserProfile();
  
  // Determine if the current user is a homeowner
  const isHomeowner = currentUserProfile?.role === 'homeowner';
  const expensesTable = isHomeowner ? 'homeowner_expenses' : 'expenses';

  return useQuery({
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
}
