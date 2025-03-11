
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
        const { data, error } = await supabase
          .from('homeowner_expenses')
          .select('*')
          .eq('project_id', projectId);
        
        if (error) {
          console.error('Error fetching homeowner expenses:', error);
          return [];
        }
        
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

      const { data, error } = await supabase
        .from('expenses')
        .select(`
          id,
          project_id,
          name,
          payee,
          amount,
          amount_due,
          expense_date,
          expense_type,
          payment_status,
          expense_number,
          notes,
          created_at,
          updated_at,
          project:project_id (
            name
          ),
          payments:expense_payments (
            id,
            amount,
            payment_date,
            status,
            notes
          )
        `)
        .eq('project_id', projectId);

      if (error) {
        console.error('Error fetching GC expenses:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!projectId,
  });

  return {
    homeownerExpenses,
    gcExpenses,
    isLoadingExpenses: isHomeownerExpensesLoading || isGCExpensesLoading
  };
}
