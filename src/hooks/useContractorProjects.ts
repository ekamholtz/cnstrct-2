
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useContractorProjects() {
  return useQuery({
    queryKey: ['contractor-projects'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');
      
      console.log('Fetching projects for contractor:', user.id);
      
      const { data, error } = await supabase
        .from('projects')
        .select(`
          id,
          name,
          status,
          address,
          clients (
            id,
            name,
            email
          )
        `)
        .eq('contractor_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
        throw error;
      }

      console.log('Successfully fetched projects:', data);
      return data || [];
    },
  });
}
