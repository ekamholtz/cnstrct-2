
import { supabase } from "@/integrations/supabase/client";
import { findClientByEmail } from "@/services/clientService";

// Mock client projects data
const mockProjects = [
  {
    id: 'mock-project-1',
    name: 'Kitchen Remodel',
    description: 'Complete kitchen renovation including new cabinets, countertops, and appliances',
    status: 'in_progress',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
  },
  {
    id: 'mock-project-2',
    name: 'Bathroom Renovation',
    description: 'Master bathroom remodel with new shower, tub, and fixtures',
    status: 'pending',
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
  },
  {
    id: 'mock-project-3',
    name: 'Deck Addition',
    description: 'Construction of a new outdoor deck with railing and stairs',
    status: 'completed',
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
  }
];

// Mock client invoices data
const mockInvoices = [
  {
    id: 'mock-invoice-1',
    invoice_number: 'INV-2023-001',
    amount: 5000,
    status: 'pending_payment',
    milestone_id: 'mock-milestone-1',
    project_id: 'mock-project-1',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
  },
  {
    id: 'mock-invoice-2',
    invoice_number: 'INV-2023-002',
    amount: 3500,
    status: 'paid',
    milestone_id: 'mock-milestone-2',
    project_id: 'mock-project-3',
    payment_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days ago
  },
  {
    id: 'mock-invoice-3',
    invoice_number: 'INV-2023-003',
    amount: 7500,
    status: 'pending_payment',
    milestone_id: 'mock-milestone-3',
    project_id: 'mock-project-1',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
  }
];

/**
 * Get client projects for the current logged in user
 * First checks Supabase database for real projects,
 * then falls back to mock data for development/testing
 */
export const getClientProjects = async () => {
  try {
    // First, get the current user information
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error getting current user:', userError);
      return mockProjects; // Return mock data as fallback
    }
    
    console.log('Current user:', user?.email);
    
    // For our test users, return mock data
    if (user?.email?.includes('tc1@email.com')) {
      console.log('Returning mock project data for test user');
      return mockProjects;
    }
    
    // For real users, try to get client ID from clients table
    try {
      // First try to find the client record for this user
      const client = user ? await findClientByEmail(user.email || '') : null;
      
      if (!client) {
        console.log('No client record found for user, returning mock data');
        return mockProjects; // Return mock data as fallback
      }
      
      console.log('Found client record:', client.id);
      
      // Now get projects associated with this client
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('client_id', client.id);
        
      if (projectsError) {
        console.error('Error getting client projects:', projectsError);
        return mockProjects; // Return mock data as fallback
      }
      
      if (!projects || projects.length === 0) {
        console.log('No projects found for client, returning mock data');
        return mockProjects; // Return mock data as fallback
      }
      
      console.log('Found real projects for client:', projects.length);
      return projects;
      
    } catch (err) {
      console.error('Error in client projects lookup:', err);
      return mockProjects;
    }
  } catch (err) {
    console.error('Error in getClientProjects:', err);
    return mockProjects;
  }
};

/**
 * Get client invoices for the specified projects
 */
export const getClientInvoices = async (projectIds: string[] = []) => {
  try {
    // If projectIds includes any of our mock project IDs, return mock data
    if (projectIds.some(id => id.startsWith('mock-'))) {
      // Filter invoices to only those matching the requested projects
      const filteredInvoices = mockInvoices.filter(invoice => 
        projectIds.includes(invoice.project_id)
      );
      
      console.log('Returning mock invoice data:', filteredInvoices.length);
      return filteredInvoices;
    }
    
    // For real project IDs, query the database
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select(`
        *,
        milestone:milestone_id(name, project:project_id(name))
      `)
      .in('project_id', projectIds);
      
    if (error) {
      console.error('Error getting client invoices:', error);
      return []; 
    }
    
    console.log('Found real invoices:', invoices?.length || 0);
    return invoices || [];
    
  } catch (err) {
    console.error('Error in getClientInvoices:', err);
    return [];
  }
};
