
import axios from "axios";
import { supabase } from "@/integrations/supabase/client";
import { getClientProjects, getClientInvoices } from "./mocks/clientApi";

// Mock API handler
const mockApi = {
  async get(url: string, config?: any) {
    console.log(`Mock API GET request to ${url}`, config);
    
    // Handle client projects endpoint
    if (url === '/api/client/projects') {
      const projects = await getClientProjects();
      return { data: projects };
    }
    
    // Handle client invoices endpoint
    if (url === '/api/client/invoices' && config?.params?.projectIds) {
      const projectIds = config.params.projectIds.split(',');
      const invoices = await getClientInvoices(projectIds);
      return { data: invoices };
    }
    
    // Default fallback to real axios for other endpoints
    return axios.get(url, config);
  }
};

// Override axios methods with our mock
const originalGet = axios.get;
axios.get = mockApi.get;

// Add a function to initialize the mock API
export function initMockApi() {
  console.log("Mock API initialized");
  
  // Create SQL function for client invoices if it doesn't exist
  const createClientInvoicesFunction = async () => {
    const { error } = await supabase.rpc('create_get_client_invoices_function');
    if (error && !error.message.includes('already exists')) {
      console.error("Error creating get_client_invoices function:", error);
    }
  };
  
  // Try to create the function
  createClientInvoicesFunction().catch(console.error);
}
