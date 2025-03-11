
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Invoice } from "@/components/project/invoice/types";

export const useClientInvoices = () => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['client-invoices-summary'],
    queryFn: async () => {
      try {
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

        // Using the REST API endpoints to avoid type issues
        // Get client record
        const clientResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/clients?user_id=eq.${user.id}`,
          {
            headers: {
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!clientResponse.ok) {
          console.error('Failed to fetch client information');
          throw new Error('Failed to fetch client');
        }

        const clients = await clientResponse.json();
        
        if (!clients || clients.length === 0) {
          console.log('No client record found for user:', user.id);
          return { invoices: [], totalPending: 0 };
        }
        
        const client = clients[0];
        console.log('Step 2: Found client:', client);

        // Get projects
        const projectsResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/projects?client_id=eq.${client.id}`,
          {
            headers: {
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!projectsResponse.ok) {
          console.error('Failed to fetch projects');
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
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/milestones?project_id=in.(${projectIds.join(',')})`,
          {
            headers: {
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!milestonesResponse.ok) {
          console.error('Failed to fetch milestones');
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
          console.error('Failed to fetch pending invoices');
          throw new Error('Failed to fetch pending invoices');
        }

        const pendingInvoices = await pendingInvoicesResponse.json();
        const totalPending = pendingInvoices?.reduce((sum: number, inv: any) => 
          sum + Number(inv.amount), 0) || 0;

        // Get display invoices (limited to 3)
        const displayInvoicesResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/invoices?milestone_id=in.(${milestoneIds.join(',')})&status=eq.pending_payment&order=created_at.desc&limit=3`,
          {
            headers: {
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!displayInvoicesResponse.ok) {
          console.error('Failed to fetch invoices');
          throw new Error('Failed to fetch invoices');
        }

        const displayInvoices = await displayInvoicesResponse.json();
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
      } catch (error) {
        console.error('Error in useClientInvoices:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load invoice data. Please try again later.",
        });
        throw error;
      }
    },
    refetchOnWindowFocus: false,
    retry: 1
  });
};
