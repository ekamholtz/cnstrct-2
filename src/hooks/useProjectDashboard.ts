
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export function useProjectDashboard(projectId: string | undefined) {
  const navigate = useNavigate();

  const { data: project, isLoading: isProjectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return null;
      }

      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          milestones (
            id,
            name,
            description,
            amount,
            status,
            project_id,
            created_at,
            updated_at
          ),
          invoices (
            id,
            amount,
            status,
            payment_date
          )
        `)
        .eq('id', projectId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: homeownerExpenses, isLoading: isExpensesLoading } = useQuery({
    queryKey: ['homeowner-expenses', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('homeowner_expenses')
        .select('*')
        .eq('project_id', projectId);

      if (error) throw error;
      return data;
    },
  });

  const { data: userRole } = useQuery({
    queryKey: ['userRole'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      return data?.role;
    }
  });

  return {
    project,
    homeownerExpenses,
    userRole,
    isLoading: isProjectLoading || isExpensesLoading
  };
}
