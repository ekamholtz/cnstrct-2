
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProjectSubscriptions } from './project/useProjectSubscriptions';
import { useProjectData } from './project/useProjectData';
import { useProjectExpenses } from './project/useProjectExpenses';
import { ClientProject } from '@/types/project-types';

export function useProjectDashboard(projectId: string | undefined) {
  // Set up real-time subscriptions
  useProjectSubscriptions(projectId);

  // Fetch project data
  const { project, isLoading: isProjectLoading, permissionError } = useProjectData(projectId);
  
  // Fetch expenses
  const { homeownerExpenses, gcExpenses, isLoadingExpenses } = useProjectExpenses(projectId);

  // Fetch user role
  const { data: userRole } = useQuery({
    queryKey: ['userRole'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from('profiles')
        .select('role, gc_account_id')
        .eq('id', user.id)
        .single();

      console.log('Current user role:', data?.role);
      return { role: data?.role, gc_account_id: data?.gc_account_id };
    }
  });

  // Check if user has admin rights
  const hasAdminRights = userRole?.role === 'platform_admin' || userRole?.role === 'gc_admin';

  // Fetch project invoices
  const { data: invoices = [], isLoading: isInvoicesLoading } = useQuery({
    queryKey: ['project-invoices', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/invoices?project_id=eq.${projectId}`, {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          console.error('Error fetching project invoices via REST API');
          return [];
        }
        
        const data = await response.json();
        return data || [];
      } catch (error) {
        console.error('Error fetching project invoices:', error);
        return [];
      }
    },
    enabled: !!projectId && !permissionError
  });

  const clientProject: ClientProject | null = project ? {
    ...project,
    address: project.address || '',
    status: (project.status as 'draft' | 'active' | 'completed' | 'cancelled') || 'draft',
    milestones: Array.isArray(project.milestones) ? project.milestones : [],
    expenses: gcExpenses
  } : null;

  return {
    project: clientProject,
    homeownerExpenses,
    gcExpenses,
    userRole: userRole?.role,
    hasAdminRights,
    isLoading: isProjectLoading || isLoadingExpenses || isInvoicesLoading,
    invoices,
    permissionError
  };
}
