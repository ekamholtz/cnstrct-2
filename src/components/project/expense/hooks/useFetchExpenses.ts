import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DatabaseExpense } from "../types";
import { useCurrentUserProfile } from "@/components/gc-profile/hooks/useCurrentUserProfile";

/**
 * Custom hook to fetch expenses for a specific project
 * @param projectId The ID of the project to fetch expenses for
 * @returns Object containing expenses data, loading state, and any errors
 */
export function useFetchExpenses(projectId: string) {
  const { currentUserProfile } = useCurrentUserProfile();

  if (!projectId) {
    console.error("useFetchExpenses called without a projectId");
    return {
      data: [],
      isLoading: false,
      error: new Error("Project ID is required to fetch expenses"),
    };
  }

  // Use React Query to fetch and cache expenses
  return useQuery({
    queryKey: ['expenses', projectId],
    queryFn: async () => {
      try {
        console.log(`Fetching expenses for project ${projectId}`);
        console.log('User role:', currentUserProfile?.role);
        console.log('User ID:', currentUserProfile?.id);
        console.log('User GC account ID:', currentUserProfile?.gc_account_id);
        
        if (!currentUserProfile) {
          console.error('No user profile found for expense fetching');
          throw new Error("Unable to fetch expenses: User not authenticated or profile not found.");
        }
        
        // Fetch expenses for the project
        const { data, error } = await supabase
          .from('expenses')
          .select(`
            *,
            project:projects(name),
            payments(*)
          `)
          .eq('project_id', projectId)
          .order('created_at', { ascending: false });
        
        // Handle database errors
        if (error) {
          console.error('Database error when fetching expenses:', error);
          
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
          
          // Handle auth errors specifically
          if (error.code === '403' || error.message?.includes('not_admin')) {
            throw new Error("Authentication error: You don't have the required permissions.");
          }
          
          throw new Error(`Failed to fetch expenses: ${error.message}`);
        }
        
        // Handle missing data
        if (!data) {
          console.warn('No expense data returned from database');
          return [];
        }
        
        // Process and sanitize the data
        const processedData = data.map((expense: any): DatabaseExpense => {
          try {
            // Ensure all required fields are present and properly formatted
            return {
              id: expense.id || '',
              project_id: expense.project_id || '',
              gc_account_id: expense.gc_account_id || '',
              contractor_id: expense.contractor_id,
              name: expense.name || 'Unnamed Expense',
              payee: expense.payee || 'Unknown',
              amount: typeof expense.amount === 'number' ? expense.amount : 
                     parseFloat(expense.amount) || 0,
              amount_due: typeof expense.amount_due === 'number' ? expense.amount_due : 
                         parseFloat(expense.amount_due) || 0,
              expense_date: expense.expense_date || new Date().toISOString(),
              expense_type: expense.expense_type || 'other',
              payment_status: expense.payment_status || 'due',
              expense_number: expense.expense_number || '',
              notes: expense.notes || '',
              created_at: expense.created_at || new Date().toISOString(),
              updated_at: expense.updated_at || new Date().toISOString(),
              project: expense.project || { name: 'Unknown Project' },
              payments: Array.isArray(expense.payments) ? expense.payments : [],
              // Include any other properties from the original expense
              ...expense
            };
          } catch (err) {
            console.error('Error processing expense data:', err, expense);
            // Return a minimal valid expense object if processing fails
            return {
              id: expense.id || 'error-id',
              project_id: expense.project_id || projectId,
              name: 'Error Processing Expense',
              payee: 'Unknown',
              amount: 0,
              expense_date: new Date().toISOString(),
              // Include original data for debugging
              _originalData: expense
            };
          }
        });
        
        console.log(`Successfully fetched ${processedData.length} expenses`);
        return processedData;
      } catch (error) {
        console.error('Error in useFetchExpenses queryFn:', error);
        throw error instanceof Error ? error : new Error('Failed to fetch expenses');
      }
    },
    // Retry failed queries a few times
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('Permission denied') || 
          error?.message?.includes('not_admin') || 
          error?.message?.includes('Authentication error')) {
        return false;
      }
      return failureCount < 3;
    },
    // Stale time of 5 minutes
    staleTime: 5 * 60 * 1000,
    // Refetch on window focus
    refetchOnWindowFocus: true,
    // Error handling
    throwOnError: false,
    // Only run the query if we have a project ID and user profile
    enabled: !!projectId && !!currentUserProfile
  });
}
