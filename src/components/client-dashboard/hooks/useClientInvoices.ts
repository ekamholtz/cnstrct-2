
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

      // Get client record using REST API
      const clientResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/clients?user_id=eq.${user.id}&select=id,name,user_id`,
        {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!clientResponse.ok) {
        console.error('Step 1 Error - Failed to fetch client:', clientResponse.statusText);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch client information",
        });
        throw new Error('Failed to fetch client');
      }

      const clientsData = await clientResponse.json();
      if (!clientsData || clientsData.length === 0) {
        return { invoices: [], totalPending: 0 };
      }
      
      const client = clientsData[0];
      console.log('Step 2: Found client:', client);

      // Get projects
      const projectsResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/projects?client_id=eq.${client.id}&select=id,name`,
        {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!projectsResponse.ok) {
        console.error('Step 3 Error - Failed to fetch projects:', projectsResponse.statusText);
        throw new Error('Failed to fetch projects');
      }

      const projects = await projectsResponse.json();
      console.log('Step 3: Found projects:', projects);

      if (!projects?.length) {
        console.log('No projects found for client');
        return { invoices: [], totalPending: 0 };
      }

      const projectIds = projects.map((p: any) => p.id);
      
      // Get milestones
      const milestonesResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/milestones?project_id=in.(${projectIds.join(',')})&select=id,name,project_id`,
        {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!milestonesResponse.ok) {
        console.error('Step 4 Error - Failed to fetch milestones:', milestonesResponse.statusText);
        throw new Error('Failed to fetch milestones');
      }

      const milestones = await milestonesResponse.json();
      console.log('Step 4: Found milestones:', milestones);

      if (!milestones?.length) {
        console.log('No milestones found for projects');
        return { invoices: [], totalPending: 0 };
      }

      const milestoneIds = milestones.map((m: any) => m.id);
      
      // Get total pending invoices amount
      const pendingInvoicesResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/invoices?milestone_id=in.(${milestoneIds.join(',')})&status=eq.pending_payment&select=amount`,
        {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!pendingInvoicesResponse.ok) {
        throw new Error('Failed to fetch pending invoices');
      }

      const allPendingInvoices = await pendingInvoicesResponse.json();
      const totalPending = allPendingInvoices?.reduce((sum: number, inv: any) => 
        sum + Number(inv.amount), 0) || 0;

      // Get display invoices (limited to 3)
      const displayInvoicesResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/invoices?milestone_id=in.(${milestoneIds.join(',')})&status=eq.pending_payment&order=created_at.asc&limit=3`,
        {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!displayInvoicesResponse.ok) {
        console.error('Step 5 Error - Failed to fetch invoices:', displayInvoicesResponse.statusText);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch invoices",
        });
        throw new Error('Failed to fetch invoices');
      }

      const displayInvoices = await displayInvoicesResponse.json();

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
          invoice_number: invoice.invoice_number,
          amount: invoice.amount,
          status: invoice.status,
          created_at: invoice.created_at,
          updated_at: invoice.updated_at,
          milestone_id: invoice.milestone_id,
          milestone_name: milestone.name,
          project_name: project.name,
          project_id: milestone.project_id,
          payment_method: invoice.payment_method,
          payment_date: invoice.payment_date,
          payment_reference: invoice.payment_reference,
          payment_gateway: invoice.payment_gateway,
          payment_method_type: null,
          simulation_data: invoice.simulation_data
        };
      }) || [];

      console.log('Step 5: Final result:', { transformedInvoices, totalPending });
      return { 
        invoices: transformedInvoices,
        totalPending
      };
    },
  });
};
