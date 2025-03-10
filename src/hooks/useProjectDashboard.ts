
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function useProjectDashboard(projectId: string | undefined) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Set up real-time subscriptions
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
    
    // Add subscription for expenses table
    const expensesChannel = supabase
      .channel(`expenses-${projectId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'expenses',
        filter: `project_id=eq.${projectId}`
      }, (payload) => {
        console.log('Expense change received:', payload);
        queryClient.invalidateQueries({ queryKey: ['gc-expenses', projectId] });
      })
      .subscribe((status) => {
        console.log('Expenses subscription status:', status);
      });
    
    // Clean up subscriptions on unmount
    return () => {
      console.log('Cleaning up project dashboard subscriptions');
      supabase.removeChannel(projectChannel);
      supabase.removeChannel(milestonesChannel);
      supabase.removeChannel(invoicesChannel);
      supabase.removeChannel(expensesChannel);
    };
  }, [projectId, queryClient]);

  const { data: project, isLoading: isProjectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return null;
      }

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
            project_id,
            created_at,
            updated_at
          ),
          invoices (
            id,
            amount,
            status,
            payment_date
          )
        `)
        .eq('id', projectId)
        .single();

      if (error) throw error;
      return data;
    },
  });

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

      return { role: data?.role, gc_account_id: data?.gc_account_id };
    }
  });

  // Determine if the current user has admin rights for this project
  const { data: hasAdminRights = false } = useQuery({
    queryKey: ['project-admin-rights', projectId, userRole],
    queryFn: async () => {
      if (!project || !userRole) return false;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      
      // Platform admins have admin rights for all projects
      if (userRole.role === 'platform_admin') return true;
      
      // Project managers have admin rights if they are the assigned user
      if (project.pm_user_id === user.id) return true;
      
      // GC admins have admin rights if they belong to the same company
      if (userRole.role === 'gc_admin' && userRole.gc_account_id === project.gc_account_id) return true;
      
      return false;
    },
    enabled: !!project && !!userRole,
  });

  const { data: homeownerExpenses, isLoading: isHomeownerExpensesLoading } = useQuery({
    queryKey: ['homeowner-expenses', projectId],
    queryFn: async () => {
      if (userRole?.role !== 'homeowner') return [];

      const { data, error } = await supabase
        .from('homeowner_expenses')
        .select(`
          *,
          project:projects(name)
        `)
        .eq('project_id', projectId);

      if (error) throw error;
      return data;
    },
    enabled: !!userRole,
  });

  const { data: gcExpenses, isLoading: isGCExpensesLoading } = useQuery({
    queryKey: ['gc-expenses', projectId],
    queryFn: async () => {
      // Also include 'project_manager' role to allow PMs to see expenses
      if (!['gc_admin', 'platform_admin', 'project_manager'].includes(userRole?.role || '')) return [];

      console.log('Fetching GC expenses for project:', projectId);
      console.log('User role:', userRole?.role);

      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          project:projects(name),
          payments(*)
        `)
        .eq('project_id', projectId);

      if (error) {
        console.error('Error fetching GC expenses:', error);
        throw error;
      }
      
      console.log('Fetched GC expenses:', data);
      console.log('Number of GC expenses:', data?.length || 0);
      return data;
    },
    enabled: !!userRole && !!projectId,
  });

  return {
    project,
    homeownerExpenses: userRole?.role === 'homeowner' ? homeownerExpenses : [],
    // Allow project managers to see GC expenses
    gcExpenses: ['gc_admin', 'platform_admin', 'project_manager'].includes(userRole?.role || '') ? gcExpenses : [],
    userRole: userRole?.role,
    hasAdminRights,
    isLoading: isProjectLoading || isHomeownerExpensesLoading || isGCExpensesLoading
  };
}
