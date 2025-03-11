
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useState } from 'react';
import { Project } from '@/types/project';

// Define extended project type to include related data
export interface ExtendedProject extends Project {
  client?: {
    id: string;
    name: string;
    email: string;
    phone_number: string;
  };
  milestones: {
    id: string;
    name: string;
    description: string | null;
    status: 'pending' | 'completed' | null;
    amount: number | null;
    project_id: string;
    created_at: string;
    updated_at: string;
  }[];
}

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
            total_contract_value,
            pm_user_id,
            gc_account_id,
            client_id,
            created_at,
            updated_at,
            client:client_id (
              id,
              name,
              email,
              phone_number
            ),
            milestones (
              id,
              name,
              description,
              status,
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

        setPermissionError(null);

        // Ensure we're returning the correct type with proper defaults
        const typedData: ExtendedProject = {
          ...data,
          client: data.client || undefined,
          milestones: Array.isArray(data.milestones) ? data.milestones : [],
          address: data.address || '',
          status: (data.status as 'draft' | 'active' | 'completed' | 'cancelled') || 'draft'
        };

        return typedData;

      } catch (err) {
        console.error('Unexpected error in project fetch:', err);
        setPermissionError('An unexpected error occurred.');
        return null;
      }
    },
    enabled: !!projectId,
    retry: (failureCount, error: any) => {
      if (error?.code === '42501' || error?.message?.includes('permission') || error?.code === 'PGRST116') {
        return false;
      }
      return failureCount < 3;
    },
  });

  return { project, isLoading, projectError, permissionError };
}
