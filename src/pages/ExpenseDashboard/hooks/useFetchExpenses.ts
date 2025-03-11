import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ExpenseFilters } from "../types";
import { useCurrentUserProfile } from "@/components/gc-profile/hooks/useCurrentUserProfile";
import { QueryResultCompat } from "@/utils/queryCompatibility";
import { Database } from "@/integrations/supabase/database.types";

export function useFetchExpenses(filters: ExpenseFilters) {
  const { currentUserProfile } = useCurrentUserProfile();
  
  // Determine if the current user is a homeowner
  const isHomeowner = currentUserProfile?.role === 'homeowner';
  
  // Type-safe table reference using type assertion
  const expensesTable = isHomeowner ? 'homeowner_expenses' : 'expenses';

  return useQuery({
    queryKey: ['expenses', filters, expensesTable],
    queryFn: async () => {
      console.log(`Fetching expenses from ${expensesTable} table with filters:`, filters);
      
      // Use a type-safe approach to handle both tables
      let query;
      
      if (expensesTable === 'homeowner_expenses') {
        query = supabase
          .from('homeowner_expenses')
          .select(`
            *,
            project:project_id (
              name
            )
          `);
      } else {
        query = supabase
          .from('expenses')
          .select(`
            *,
            project:project_id (
              name
            )
          `);
      }

      // Apply filters
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
      return data || [];
    },
    // Ensure query doesn't run until profile is loaded
    enabled: !!currentUserProfile,
  }) as QueryResultCompat;
}
