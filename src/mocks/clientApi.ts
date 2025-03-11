
import { supabase } from "@/integrations/supabase/client";

// Get client projects
export async function getClientProjects() {
  console.log("Fetching mock client projects");
  
  try {
    // In a real implementation, this would filter by the authenticated user
    // For now, we'll just return all projects as a mock
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error("Error fetching client projects:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Exception in getClientProjects:", error);
    return [];
  }
}

// Get client invoices for given project IDs
export async function getClientInvoices(projectIds: string[]) {
  console.log("Fetching mock client invoices for projects:", projectIds);
  
  if (!projectIds.length) {
    return { invoices: [], totalPending: 0 };
  }
  
  try {
    // Try to use our custom function if it exists
    try {
      const { data, error } = await supabase.rpc('get_client_invoices', {
        project_ids: projectIds
      });
      
      if (!error && data) {
        console.log("Successfully fetched invoices using RPC function:", data);
        
        // Calculate total pending
        const totalPending = data
          .filter((invoice: any) => invoice.status === 'pending_payment')
          .reduce((sum: number, invoice: any) => sum + Number(invoice.amount), 0);
        
        return {
          invoices: data,
          totalPending
        };
      }
    } catch (rpcError) {
      console.warn("RPC function not available, falling back to direct query:", rpcError);
    }
    
    // Fallback to direct query if RPC fails
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        milestone:milestone_id(name),
        project:project_id(name)
      `)
      .in('project_id', projectIds);
    
    if (error) {
      console.error("Error fetching client invoices:", error);
      return { invoices: [], totalPending: 0 };
    }
    
    // Transform data to expected format
    const invoices = (data || []).map((invoice: any) => ({
      ...invoice,
      milestone_name: invoice.milestone?.name || 'Unknown Milestone',
      project_name: invoice.project?.name || 'Unknown Project'
    }));
    
    // Calculate total pending
    const totalPending = invoices
      .filter((invoice: any) => invoice.status === 'pending_payment')
      .reduce((sum: number, invoice: any) => sum + Number(invoice.amount), 0);
    
    return {
      invoices,
      totalPending
    };
  } catch (error) {
    console.error("Exception in getClientInvoices:", error);
    return { invoices: [], totalPending: 0 };
  }
}
