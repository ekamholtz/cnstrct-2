
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProjectSubscriptions } from './project/useProjectSubscriptions';
import { useProjectData } from './project/useProjectData';
import { useProjectExpenses } from './project/useProjectExpenses';
import { ClientProject, UserRole } from '@/types/project-types';

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
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        // Use REST API to avoid TypeScript errors
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=role,gc_account_id`, {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          console.error('Error fetching user role via REST API:', response.statusText);
          return null;
        }
        
        const data = await response.json();
        const userProfile = data[0] || {};
        
        console.log('Current user role:', userProfile?.role);
        return { role: userProfile?.role as UserRole, gc_account_id: userProfile?.gc_account_id };
      } catch (error) {
        console.error('Error fetching user role:', error);
        return null;
      }
    }
  });

  // Check if user has admin rights
  const hasAdminRights = 
    userRole?.role === 'platform_admin' || 
    userRole?.role === 'gc_admin';

  // Fetch project invoices
  const { data: invoices = [], isLoading: isInvoicesLoading } = useQuery({
    queryKey: ['project-invoices', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      try {
        // Use REST API to avoid TypeScript errors with invoices table
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

  // Create a proper ClientProject object with all required fields
  const clientProject: ClientProject | null = project ? {
    ...project,
    address: project.address || '',
    status: project.status || 'draft',
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
