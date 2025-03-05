
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
      console.log('User ID:', currentUserProfile?.id);
      console.log('User GC account ID:', currentUserProfile?.gc_account_id);
      
      try {
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
          
          // Additional context for RLS policy errors
          if (error.code === '42501') {
            console.error('Row-level security policy violation. Check if user has proper permissions:', {
              userRole: currentUserProfile?.role,
              userId: currentUserProfile?.id,
              projectId: projectId,
              gcAccountId: currentUserProfile?.gc_account_id
            });
            throw new Error("Permission denied: You don't have access to view expenses for this project.");
          }
          
          throw new Error(`Failed to fetch expenses: ${error.message}`);
        }
        
        console.log('Fetched expenses:', data);
        console.log('Number of expenses returned:', data?.length || 0);
        return data as Expense[];
      } catch (error) {
        console.error('Exception during expenses fetch:', error);
        throw error;
      }
    },
    enabled: !!projectId && !!currentUserProfile,
  });
}
