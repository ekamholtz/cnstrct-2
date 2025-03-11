import { supabase } from "@/integrations/supabase/client";

// Get client projects
export async function getClientProjects() {
  console.log("Fetching mock client projects");
  
  try {
    // Get current authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    console.log("Current user in getClientProjects:", user?.email);
    
    if (!user) {
      console.log("No authenticated user found");
      return [];
    }
    
    // Check if we should return specific mock data for tc1@email.com
    if (user.email === "tc1@email.com") {
      console.log("Returning mock projects for tc1@email.com");
      return [
        {
          id: "mock-project-1",
          name: "Home Renovation",
          description: "Complete renovation of kitchen and bathrooms",
          status: "active",
          created_at: new Date().toISOString(),
          client_id: "95b6a19a-4000-4ef8-8df8-62043e6429e1"
        },
        {
          id: "mock-project-2",
          name: "Backyard Landscaping",
          description: "Landscaping and outdoor patio construction",
          status: "pending",
          created_at: new Date().toISOString(),
          client_id: "95b6a19a-4000-4ef8-8df8-62043e6429e1"
        }
      ];
    }
    
    // Otherwise, try to get projects from the database
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
  
  // Create mock invoices for the tc1@email.com test account
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.email === "tc1@email.com") {
    console.log("Returning mock invoices for tc1@email.com");
    
    const mockInvoices = [
      {
        id: "mock-invoice-1",
        invoice_number: "INV-2024-0001",
        amount: 2500,
        status: "pending_payment",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        milestone_id: "mock-milestone-1",
        project_id: "mock-project-1",
        milestone_name: "Foundation Complete",
        project_name: "Home Renovation"
      },
      {
        id: "mock-invoice-2",
        invoice_number: "INV-2024-0002",
        amount: 1800,
        status: "paid",
        created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        payment_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        milestone_id: "mock-milestone-2",
        project_id: "mock-project-1",
        milestone_name: "Framing Complete",
        project_name: "Home Renovation"
      }
    ];
    
    const totalPending = mockInvoices
      .filter((invoice) => invoice.status === "pending_payment")
      .reduce((sum, invoice) => sum + invoice.amount, 0);
    
    return {
      invoices: mockInvoices,
      totalPending
    };
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
