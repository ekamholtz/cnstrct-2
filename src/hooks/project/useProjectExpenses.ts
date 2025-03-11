
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useProjectExpenses(projectId: string | undefined) {
  const { data: homeownerExpenses = [], isLoading: isHomeownerExpensesLoading } = useQuery({
    queryKey: ['homeowner-expenses', projectId],
    queryFn: async () => {
      if (!projectId || projectId.trim() === '') {
        console.warn('Invalid projectId for homeowner expenses query');
        return [];
      }
      
      try {
        // Use REST API to avoid TypeScript errors with homeowner_expenses table
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/homeowner_expenses?project_id=eq.${projectId}`, {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          console.error('Error fetching homeowner expenses via REST API:', response.statusText);
          return [];
        }
        
        const data = await response.json();
        return data || [];
      } catch (error) {
        console.error('Error fetching homeowner expenses:', error);
        return [];
      }
    },
    enabled: !!projectId && projectId.trim() !== '',
  });

  const { data: gcExpenses = [], isLoading: isGCExpensesLoading } = useQuery({
    queryKey: ['gc-expenses', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      try {
        // Use REST API to avoid TypeScript errors
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/expenses?project_id=eq.${projectId}`, {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          console.error('Error fetching GC expenses via REST API:', response.statusText);
          return [];
        }
        
        const expenses = await response.json();

        // Fetch payments using REST API if there are expenses
        if (expenses.length > 0) {
          const expenseIds = expenses.map(e => e.id).join(',');
          const paymentsResponse = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/payments?expense_id=in.(${expenseIds})`,
            {
              headers: {
                'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (paymentsResponse.ok) {
            const payments = await paymentsResponse.json();
            
            // Combine expenses with their payments
            return expenses.map(expense => ({
              ...expense,
              payments: payments.filter(p => p.expense_id === expense.id) || []
            }));
          }
        }
        
        return expenses;
      } catch (error) {
        console.error('Error in gcExpenses query:', error);
        return [];
      }
    },
    enabled: !!projectId,
  });

  return {
    homeownerExpenses,
    gcExpenses,
    isLoadingExpenses: isHomeownerExpensesLoading || isGCExpensesLoading
  };
}
