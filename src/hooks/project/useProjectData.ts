
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useState } from 'react';

export function useProjectData(projectId: string | undefined) {
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const { data: project, isLoading, error: projectError } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      if (!projectId) return null;

      try {
        console.log('Fetching project with ID:', projectId);
        const { data, error } = await supabase
          .from('projects')
          .select(`
            id,
            name,
            description,
            address,
            status,
            start_date,
            end_date,
            budget,
            owner_user_id,
            contractor_id,
            pm_user_id,
            gc_account_id,
            client_id,
            created_at,
            updated_at,
            milestones (
              id,
              name,
              description,
              status,
              due_date,
              amount,
              project_id,
              created_at,
              updated_at
            )
          `)
          .eq('id', projectId)
          .single();

        if (error) {
          console.error('Error fetching project:', error);
          
          // Check for specific permission errors
          if (error.code === '42501' || error.message.includes('permission')) {
            setPermissionError('You do not have permission to view this project.');
            toast({
              title: "Access Denied",
              description: "You don't have permission to view this project.",
              variant: "destructive",
            });
          } else if (error.code === 'PGRST116') {
            setPermissionError('Project not found.');
            toast({
              title: "Project Not Found",
              description: "The project you're looking for does not exist.",
              variant: "destructive",
            });
          }
          
          return null;
        }

        // Clear any previous permission errors
        setPermissionError(null);

        return {
          ...data,
          address: data.address || ''
        };
      } catch (err) {
        console.error('Unexpected error in project fetch:', err);
        setPermissionError('An unexpected error occurred.');
        return null;
      }
    },
    enabled: !!projectId,
    retry: (failureCount, error: any) => {
      // Don't retry permission errors
      if (error?.code === '42501' || error?.message?.includes('permission') || error?.code === 'PGRST116') {
        return false;
      }
      return failureCount < 3;
    },
  });

  return { project, isLoading, projectError, permissionError };
}
