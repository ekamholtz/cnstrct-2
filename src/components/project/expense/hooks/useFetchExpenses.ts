
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Expense } from "../types";
import { useCurrentUserProfile } from "@/components/gc-profile/hooks/useCurrentUserProfile";

export function useFetchExpenses(projectId: string) {
  const { currentUserProfile } = useCurrentUserProfile();

  return useQuery({
    queryKey: ['expenses', projectId],
    queryFn: async () => {
      console.log('Fetching expenses for project:', projectId);
      console.log('User role:', currentUserProfile?.role);
      
      // Always query the expenses table (not homeowner_expenses) for project details page
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          project:projects(name),
          payments(*)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching expenses:', error);
        throw error;
      }
      
      console.log('Fetched expenses:', data);
      return data as Expense[];
    },
    enabled: !!projectId && !!currentUserProfile,
  });
}
