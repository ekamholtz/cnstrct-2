
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useContractorProjects() {
  return useQuery({
    queryKey: ['contractor-projects'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');
      
      const { data, error } = await supabase
        .from('projects')
        .select('id')
        .eq('contractor_id', user.id);

      if (error) {
        console.error('Error fetching projects:', error);
        throw error;
      }

      return data || [];
    },
  });
}
