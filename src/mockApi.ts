
import axios, { AxiosResponse, AxiosRequestConfig } from "axios";
import { supabase } from "@/integrations/supabase/client";
import { getClientProjects, getClientInvoices } from "./mocks/clientApi";

// Define a strong return type for our mock API
type MockApiResponse<T = any> = Promise<AxiosResponse<T>>;

// Mock API handler with proper typing
const mockApi = {
  // Properly type the get method
  async get<T = any>(url: string, config?: AxiosRequestConfig): MockApiResponse<T> {
    console.log(`Mock API GET request to ${url}`, config);
    
    // Handle client projects endpoint
    if (url === '/api/client/projects') {
      const { data: { user } } = await supabase.auth.getUser();
      console.log("Current user in mockApi:", user?.email);
      
      const projects = await getClientProjects();
      console.log("Returned projects:", projects);
      // Return in the same format as axios would
      return { 
        data: projects as T, 
        status: 200, 
        statusText: 'OK',
        headers: {},
        config: config || {}
      } as AxiosResponse<T>;
    }
    
    // Handle client invoices endpoint
    if (url === '/api/client/invoices' && config?.params?.projectIds) {
      const projectIds = config.params.projectIds.split(',');
      const invoices = await getClientInvoices(projectIds);
      // Return in the same format as axios would
      return { 
        data: invoices as T, 
        status: 200, 
        statusText: 'OK',
        headers: {},
        config: config || {}
      } as AxiosResponse<T>;
    }
    
    // Default fallback to real axios for other endpoints
    return axios.get(url, config);
  }
};

// Use type assertions to fix the type incompatibility
axios.get = mockApi.get as typeof axios.get;

// Add a function to initialize the mock API
export function initMockApi() {
  console.log("Mock API initialized");
  
  // Create SQL function for client invoices if it doesn't exist
  const createClientInvoicesFunction = async () => {
    try {
      const { error } = await supabase.rpc('create_get_client_invoices_function');
      if (error && !error.message.includes('already exists')) {
        console.error("Error creating get_client_invoices function:", error);
      }
    } catch (err) {
      console.error("Error calling RPC function:", err);
    }
  };
  
  // Try to create the function
  createClientInvoicesFunction();
}
