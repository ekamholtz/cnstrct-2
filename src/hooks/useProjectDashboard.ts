import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { getProjectInvoices } from "@/services/invoiceService";

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

    // Clean up subscriptions on unmount
    return () => {
      console.log('Cleaning up project dashboard subscriptions');
      supabase.removeChannel(projectChannel);
      supabase.removeChannel(milestonesChannel);
      supabase.removeChannel(invoicesChannel);
    };
  }, [projectId, queryClient]);

  const { data: project, isLoading: isProjectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      if (!projectId) return null;

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
        return null;
      }

      // Ensure the address property is always present to satisfy ClientProject type
      return {
        ...data,
        address: data.address || ''
      };
    },
    enabled: !!projectId,
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

  // Check if user has admin rights
  const hasAdminRights = useMemo(() => {
    if (!userRole) return false;

    // Fix the role comparison by using type assertion or proper type checking
    const role = userRole.role as string;
    return role === 'platform_admin' || role === 'gc_admin';
  }, [userRole]);

  // Fetch homeowner expenses
  const { data: homeownerExpenses = [], isLoading: isHomeownerExpensesLoading } = useQuery({
    queryKey: ['homeowner-expenses', projectId],
    queryFn: async () => {
      // Ensure projectId is a valid UUID before making the request
      if (!projectId || projectId.trim() === '') {
        console.warn('Invalid projectId for homeowner expenses query');
        return [];
      }
      
      try {
        // Use a direct SQL query via Supabase's REST API to avoid TypeScript errors
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/homeowner_expenses?project_id=eq.${projectId}`, {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          console.error('Error fetching homeowner expenses via REST API');
          return [];
        }
        
        const data = await response.json();
        return data || [];
      } catch (error) {
        console.error('Error fetching homeowner expenses:', error);
        
        // Return empty array as fallback
        return [];
      }
    },
    enabled: !!userRole && !!projectId && projectId.trim() !== '',
  });

  const { data: gcExpenses = [], isLoading: isGCExpensesLoading } = useQuery({
    queryKey: ['gc-expenses', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('expenses')
        .select(`
          id,
          project_id,
          name,
          payee,
          amount,
          amount_due,
          expense_date,
          expense_type,
          payment_status,
          expense_number,
          notes,
          created_at,
          updated_at,
          project:project_id (
            name
          ),
          payments (
            id,
            amount,
            payment_date,
            payment_method,
            status
          )
        `)
        .eq('project_id', projectId);

      if (error) {
        console.error('Error fetching GC expenses:', error);
        return [];
      }

      // Filter expenses based on user role without accessing non-existent properties
      if (userRole?.role === 'contractor') {
        return data.filter(expense => {
          // Avoid accessing non-existent properties
          return true; // For now, include all expenses for contractor
        }) || [];
      }

      return data || [];
    },
    enabled: !!userRole && !!projectId,
  });

  // Fetch project invoices separately
  const { data: projectInvoices = [], isLoading: isInvoicesLoading } = useQuery({
    queryKey: ['project-invoices', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      try {
        // Use the invoiceService function we implemented earlier
        const invoices = await getProjectInvoices(projectId);
        return invoices || [];
      } catch (error) {
        console.error('Error fetching project invoices:', error);
        return [];
      }
    },
    enabled: !!projectId
  });

  return {
    project: project ? {
      ...project,
      // Ensure expenses is always an array for PnL calculations
      expenses: Array.isArray(gcExpenses) ? gcExpenses : []
    } : null,
    homeownerExpenses: userRole?.role === 'homeowner' ? homeownerExpenses : [],
    gcExpenses: ['gc_admin', 'platform_admin'].includes(userRole?.role || '') ? gcExpenses : [],
    userRole: userRole?.role,
    hasAdminRights,
    isLoading: isProjectLoading || isHomeownerExpensesLoading || isGCExpensesLoading || isInvoicesLoading,
    invoices: projectInvoices // Use the separately fetched invoices
  };
}
