
import { supabase } from "@/integrations/supabase/client";
import { Invoice } from "@/components/project/invoice/types";

/**
 * Gets client projects based on the current user
 */
export const getClientProjects = async () => {
  try {
    // First get the user ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error("No authenticated user found");
      return [];
    }

    // Get client records associated with this user
    const { data: clients, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user.id);

    if (clientError || !clients?.length) {
      console.error("Error fetching client or no client found:", clientError);
      return [];
    }

    const clientId = clients[0].id;

    // Get projects for this client
    const { data: projects, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('client_id', clientId);

    if (projectError) {
      console.error("Error fetching projects:", projectError);
      return [];
    }

    return projects || [];
  } catch (error) {
    console.error("Error in getClientProjects:", error);
    return [];
  }
};

/**
 * Gets all invoices for a set of project IDs
 */
export const getClientInvoices = async (projectIds: string[]): Promise<Invoice[]> => {
  try {
    if (!projectIds.length) return [];

    // Get invoices that match these project IDs
    const { data, error } = await supabase
      .rpc('get_client_invoices', { project_ids: projectIds });

    if (error) {
      console.error("Error fetching invoices:", error);
      return [];
    }

    // Transform to match the Invoice type
    return (data || []).map(invoice => ({
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      amount: invoice.amount,
      status: invoice.status,
      created_at: invoice.created_at,
      milestone_id: invoice.milestone_id,
      milestone_name: invoice.milestone_name || '',
      project_name: invoice.project_name || '',
      project_id: invoice.project_id,
      payment_method: invoice.payment_method,
      payment_date: invoice.payment_date,
      payment_reference: invoice.payment_reference,
      payment_gateway: invoice.payment_gateway,
      simulation_data: invoice.simulation_data,
      updated_at: invoice.updated_at
    }));
  } catch (error) {
    console.error("Error in getClientInvoices:", error);
    return [];
  }
};
