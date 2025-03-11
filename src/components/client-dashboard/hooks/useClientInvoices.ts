
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Invoice } from "@/components/project/invoice/types";

export const useClientInvoices = () => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['client-invoices-summary'],
    queryFn: async () => {
      // First get the authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Auth error in useClientInvoices:', authError);
        throw new Error('Authentication error');
      }
      
      if (!user) {
        console.error('No authenticated user found');
        throw new Error('No user found');
      }

      console.log('Step 1: Starting query with user:', user.id);

      // Get client record
      const { data: clients, error: clientError } = await supabase
        .from('clients')
        .select('id,name,user_id')
        .eq('user_id', user.id);

      if (clientError) {
        console.error('Step 1 Error - Failed to fetch client:', clientError);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch client information",
        });
        throw new Error('Failed to fetch client');
      }
      
      if (!clients || clients.length === 0) {
        console.log('No client record found for user:', user.id);
        return { invoices: [], totalPending: 0 };
      }
      
      const client = clients[0];
      console.log('Step 2: Found client:', client);

      // Get projects
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id,name')
        .eq('client_id', client.id);

      if (projectsError) {
        console.error('Step 3 Error - Failed to fetch projects:', projectsError);
        throw new Error('Failed to fetch projects');
      }

      console.log('Step 3: Found projects:', projects);

      if (!projects?.length) {
        console.log('No projects found for client');
        return { invoices: [], totalPending: 0 };
      }

      const projectIds = projects.map((p: any) => p.id);
      
      // Get milestones
      const { data: milestones, error: milestonesError } = await supabase
        .from('milestones')
        .select('id,name,project_id')
        .in('project_id', projectIds);

      if (milestonesError) {
        console.error('Step 4 Error - Failed to fetch milestones:', milestonesError);
        throw new Error('Failed to fetch milestones');
      }

      console.log('Step 4: Found milestones:', milestones);

      if (!milestones?.length) {
        console.log('No milestones found for projects');
        return { invoices: [], totalPending: 0 };
      }

      const milestoneIds = milestones.map((m: any) => m.id);
      
      // Get total pending invoices amount
      const { data: pendingInvoices, error: pendingError } = await supabase
        .from('invoices')
        .select('amount')
        .in('milestone_id', milestoneIds)
        .eq('status', 'pending_payment');

      if (pendingError) {
        console.error('Error fetching pending invoices:', pendingError);
        throw new Error('Failed to fetch pending invoices');
      }

      const totalPending = pendingInvoices?.reduce((sum: number, inv: any) => 
        sum + Number(inv.amount), 0) || 0;

      // Get display invoices (limited to 3)
      const { data: displayInvoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .in('milestone_id', milestoneIds)
        .eq('status', 'pending_payment')
        .order('created_at', { ascending: false })
        .limit(3);

      if (invoicesError) {
        console.error('Step 5 Error - Failed to fetch invoices:', invoicesError);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch invoices",
        });
        throw new Error('Failed to fetch invoices');
      }

      console.log('Step 5: Found invoices:', displayInvoices);

      // Create a map of milestone IDs to names and project info
      const milestoneMap = milestones.reduce((acc: Record<string, any>, milestone: any) => {
        acc[milestone.id] = milestone;
        return acc;
      }, {});
      
      // Create a map of project IDs to names
      const projectMap = projects.reduce((acc: Record<string, any>, project: any) => {
        acc[project.id] = project;
        return acc;
      }, {});

      // Transform the data to match the Invoice type
      const transformedInvoices: Invoice[] = displayInvoices?.map((invoice: any) => {
        const milestone = milestoneMap[invoice.milestone_id] || {};
        const project = projectMap[milestone.project_id] || {};
        
        return {
          id: invoice.id,
          invoice_number: invoice.invoice_number || 'N/A',
          amount: invoice.amount || 0,
          status: invoice.status || 'pending_payment',
          created_at: invoice.created_at || new Date().toISOString(),
          updated_at: invoice.updated_at || new Date().toISOString(),
          milestone_id: invoice.milestone_id,
          milestone_name: milestone.name || 'Unknown Milestone',
          project_name: project.name || 'Unknown Project',
          project_id: milestone.project_id || '',
          payment_method: invoice.payment_method || null,
          payment_date: invoice.payment_date || null,
          payment_reference: invoice.payment_reference || null,
          payment_gateway: invoice.payment_gateway || null,
          payment_method_type: null,
          simulation_data: invoice.simulation_data || null
        };
      }) || [];

      console.log('Final result:', { transformedInvoices, totalPending });
      
      return { 
        invoices: transformedInvoices,
        totalPending
      };
    },
    refetchOnWindowFocus: false,
    retry: 1
  });
};
