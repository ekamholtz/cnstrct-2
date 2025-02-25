
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useClientMetrics() {
  return useQuery({
    queryKey: ['client-metrics'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      const { data: projects } = await supabase
        .from('projects')
        .select(`
          *,
          milestones (
            id,
            amount,
            status
          ),
          invoices (
            id,
            amount,
            status
          )
        `);

      return {
        profile: profileData,
        projects: projects || []
      };
    }
  });
}
