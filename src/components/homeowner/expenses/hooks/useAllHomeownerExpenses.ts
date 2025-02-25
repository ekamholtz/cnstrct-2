
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { HomeownerExpense } from "../types";

export function useAllHomeownerExpenses() {
  const { data: expenses, isLoading } = useQuery({
    queryKey: ['all-homeowner-expenses'],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('homeowner_expenses')
        .select(`
          *,
          project:projects(name)
        `)
        .eq('homeowner_id', session.session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all homeowner expenses:', error);
        throw error;
      }

      return data as (HomeownerExpense & { project: { name: string } })[];
    },
  });

  return {
    expenses,
    isLoading,
  };
}
