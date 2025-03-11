
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useProjectSubscriptions(projectId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!projectId) return;

    console.log('Setting up real-time subscriptions for project:', projectId);

    // Subscribe to project changes
    const projectChannel = supabase
      .channel(`project-${projectId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'projects',
        filter: `id=eq.${projectId}`
      }, (payload) => {
        console.log('Project change received:', payload);
        queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      })
      .subscribe((status) => {
        console.log('Project subscription status:', status);
      });

    // Subscribe to milestone changes for this project
    const milestonesChannel = supabase
      .channel(`milestones-${projectId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'milestones',
        filter: `project_id=eq.${projectId}`
      }, (payload) => {
        console.log('Milestone change received:', payload);
        queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      })
      .subscribe((status) => {
        console.log('Milestones subscription status:', status);
      });

    // Subscribe to invoice changes for this project
    const invoicesChannel = supabase
      .channel(`invoices-${projectId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'invoices',
        filter: `project_id=eq.${projectId}`
      }, (payload) => {
        console.log('Invoice change received:', payload);
        queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      })
      .subscribe((status) => {
        console.log('Invoices subscription status:', status);
      });

    // Clean up subscriptions on unmount
    return () => {
      console.log('Cleaning up project dashboard subscriptions');
      supabase.removeChannel(projectChannel);
      supabase.removeChannel(milestonesChannel);
      supabase.removeChannel(invoicesChannel);
    };
  }, [projectId, queryClient]);
}
