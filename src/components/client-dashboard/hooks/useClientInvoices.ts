
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Invoice } from "@/components/project/invoice/types";

export const useClientInvoices = () => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['client-invoices-summary'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        throw new Error('No user found');
      }

      console.log('Step 1: Starting query with user:', user.id);

      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('id, name, user_id')
        .eq('user_id', user.id)
        .single();

      if (clientError) {
        console.error('Step 1 Error - Failed to fetch client:', clientError);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch client information",
        });
        throw clientError;
      }

      console.log('Step 2: Found client:', client);

      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id, name')
        .eq('client_id', client.id);

      if (projectsError) {
        console.error('Step 3 Error - Failed to fetch projects:', projectsError);
        throw projectsError;
      }

      console.log('Step 3: Found projects:', projects);

      if (!projects?.length) {
        console.log('No projects found for client');
        return { invoices: [], totalPending: 0 };
      }

      const projectIds = projects.map(p => p.id);
      const { data: milestones, error: milestonesError } = await supabase
        .from('milestones')
        .select('id, name, project_id')
        .in('project_id', projectIds);

      if (milestonesError) {
        console.error('Step 4 Error - Failed to fetch milestones:', milestonesError);
        throw milestonesError;
      }

      console.log('Step 4: Found milestones:', milestones);

      if (!milestones?.length) {
        console.log('No milestones found for projects');
        return { invoices: [], totalPending: 0 };
      }

      const milestoneIds = milestones.map(m => m.id);
      const { data: allPendingInvoices, error: pendingError } = await supabase
        .from('invoices')
        .select('amount')
        .in('milestone_id', milestoneIds)
        .eq('status', 'pending_payment');

      if (pendingError) throw pendingError;

      const totalPending = allPendingInvoices?.reduce((sum, inv) => 
        sum + Number(inv.amount), 0) || 0;

      // Use standard format for querying with foreign table data
      const { data: displayInvoices, error: invoiceError } = await supabase
        .from('invoices')
        .select(`
          *,
          milestone:milestone_id (
            id,
            name,
            project:project_id (
              id,
              name
            )
          )
        `)
        .in('milestone_id', milestoneIds)
        .eq('status', 'pending_payment')
        .order('created_at', { ascending: true })
        .limit(3);

      if (invoiceError) {
        console.error('Step 5 Error - Failed to fetch invoices:', invoiceError);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch invoices",
        });
        throw invoiceError;
      }

      // Transform the data to match the Invoice type
      const transformedInvoices: Invoice[] = displayInvoices?.map(invoice => ({
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        amount: invoice.amount,
        status: invoice.status,
        created_at: invoice.created_at,
        updated_at: invoice.updated_at,
        milestone_id: invoice.milestone_id,
        milestone_name: invoice.milestone?.name,
        project_name: invoice.milestone?.project?.name,
        project_id: invoice.milestone?.project?.id,
        payment_method: null,
        payment_date: null,
        payment_reference: null,
        payment_gateway: null,
        payment_method_type: null,
        simulation_data: null
      })) || [];

      console.log('Step 5: Final result:', { transformedInvoices, totalPending });
      return { 
        invoices: transformedInvoices,
        totalPending
      };
    },
  });
};
