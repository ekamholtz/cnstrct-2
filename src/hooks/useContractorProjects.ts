
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Project } from "@/types/project";
import { useToast } from "@/components/ui/use-toast";
import { useUserRole } from "@/hooks/profile/useUserRole";
import { useQueryClient } from "@tanstack/react-query";

export function useContractorProjects() {
  const { toast } = useToast();
  const userRole = useUserRole();
  const queryClient = useQueryClient();

  // Set up real-time subscription to projects table
  useEffect(() => {
    if (!userRole) return;
    
    console.log('Setting up real-time subscription for projects');
    
    const channel = supabase
      .channel('public:projects')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'projects'
      }, (payload) => {
        console.log('Project change received:', payload);
        queryClient.invalidateQueries({ queryKey: ['projects', userRole] });
      })
      .subscribe((status) => {
        console.log('Projects subscription status:', status);
      });
    
    // Also subscribe to milestones for project progress updates
    const milestonesChannel = supabase
      .channel('public:milestones')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'milestones'
      }, (payload) => {
        console.log('Milestone change received:', payload);
        queryClient.invalidateQueries({ queryKey: ['all-projects-milestones'] });
        queryClient.invalidateQueries({ queryKey: ['projects', userRole] });
      })
      .subscribe((status) => {
        console.log('Milestones subscription status:', status);
      });
    
    return () => {
      console.log('Cleaning up real-time subscriptions');
      supabase.removeChannel(channel);
      supabase.removeChannel(milestonesChannel);
    };
  }, [userRole, queryClient]);

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

      // Apply role-specific filters
      if (userRole === 'gc_admin') {
        console.log('Applying GC admin filter');
        const { data: profile } = await supabase
          .from('profiles')
          .select('gc_account_id')
          .eq('id', user.id)
          .single();
          
        if (profile && profile.gc_account_id) {
          // For GC admins, show all projects for their company
          query = query.eq('gc_account_id', profile.gc_account_id);
        }
      } else if (userRole === 'project_manager') {
        console.log('Applying PM filter');
        // For project managers, only show projects where they are the assigned user
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
