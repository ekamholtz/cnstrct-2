
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
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/homeowner_expenses?project_id=eq.${projectId}`, {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          console.error('Error fetching homeowner expenses via REST API');
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
          payments (
            id,
            amount,
            payment_date,
            payment_method,
            status
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
