
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ClientProject } from '@/types/project-types';

export function useProjectData(projectId: string | undefined) {
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      if (!projectId) return null;

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
        }
        return null;
      }

      // Transform the data to match ClientProject type
      const transformedProject: ClientProject = {
        ...data,
        milestones: data.milestones || [],
        address: data.address || '',
        status: (data.status as 'draft' | 'active' | 'completed' | 'cancelled') || 'draft'
      };

      return transformedProject;
    },
    enabled: !!projectId
  });

  return { project, isLoading, permissionError };
}
