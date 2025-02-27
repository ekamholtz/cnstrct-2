
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Project } from "@/types/project";
import { useToast } from "@/components/ui/use-toast";
import { useUserRole } from "@/hooks/profile/useUserRole";

export function useContractorProjects() {
  const { toast } = useToast();
  const userRole = useUserRole();

  return useQuery({
    queryKey: ['projects', userRole],
    queryFn: async () => {
      console.log('Starting project fetch... User role:', userRole);
      
      // Verify user is authenticated
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('No user found or error:', userError);
        throw new Error('No user found');
      }

      console.log('Fetching projects for user:', user.id);

      // Build query based on user role and permissions
      let query = supabase
        .from('projects')
        .select(`
          *,
          clients (
            id,
            name,
            email,
            address,
            phone_number
          ),
          milestones (
            id,
            name,
            amount,
            status
          )
        `)
        .order('created_at', { ascending: false });

      // Apply role-specific filters (though RLS should handle this server-side)
      if (userRole === 'gc_admin') {
        console.log('Applying GC admin filter');
        query = query.eq('contractor_id', user.id);
      } else if (userRole === 'project_manager') {
        console.log('Applying PM filter');
        query = query.eq('pm_user_id', user.id);
      }
      // For platform_admin, no additional filters needed

      const { data: projects, error: projectsError } = await query;

      if (projectsError) {
        console.error('Error fetching projects:', projectsError);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load projects. Please try again.",
        });
        throw projectsError;
      }

      console.log(`Projects found (${userRole}):`, projects?.length || 0);
      return projects as Project[];
    },
    enabled: !!userRole, // Only run query when user role is available
    retry: 1, // Limit retries to avoid spamming if there's a persistent error
    meta: {
      onError: (error: Error) => {
        console.error('Query error:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "There was a problem loading your projects. Please refresh the page."
        });
      }
    }
  });
}
