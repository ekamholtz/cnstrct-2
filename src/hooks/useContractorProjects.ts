
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Project } from "@/types/project";
import { useToast } from "@/components/ui/use-toast";

export function useContractorProjects() {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      console.log('Starting project fetch...');
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('No user found or error:', userError);
        throw new Error('No user found');
      }

      console.log('Fetching projects for user:', user.id);

      // Get user's profile with company info
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          gc_companies (
            id,
            company_name,
            contact_email,
            contact_phone
          )
        `)
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        throw profileError;
      }

      // Single query to get projects with related data
      // RLS policies will automatically filter based on user role and access
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select(`
          *,
          clients (
            name,
            email,
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

      if (projectsError) {
        console.error('Error fetching projects:', projectsError);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load projects. Please try again.",
        });
        throw projectsError;
      }

      console.log('Projects found:', projects);
      return projects as Project[];
    },
    meta: {
      onSettled: (data, error) => {
        if (error) {
          console.error('Query error:', error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load projects. Please try again.",
          });
        }
      }
    }
  });
}
