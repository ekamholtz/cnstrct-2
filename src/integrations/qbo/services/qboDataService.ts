
import { supabase } from "@/integrations/supabase/client";

/**
 * Service for interacting with QBO Data API using Edge Functions
 */
export class QBODataService {
  /**
   * Make a request to the QBO API
   */
  async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
    data?: any
  ): Promise<{
    success: boolean;
    data?: T;
    error?: string;
  }> {
    try {
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: "User must be logged in to access QBO data" };
      }
      
      // Call the data operation edge function
      const response = await supabase.functions.invoke('qbo-data-operation', {
        body: {
          userId: user.id,
          endpoint,
          method,
          data
        }
      });
      
      if (response.error) {
        return {
          success: false,
          error: response.error.message
        };
      }
      
      return {
        success: true,
        data: response.data as T
      };
    } catch (err) {
      console.error(`QBO API request failed (${endpoint}):`, err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Run a query against the QBO API
   */
  async query<T>(queryString: string): Promise<{
    success: boolean;
    data?: T;
    error?: string;
  }> {
    return this.makeRequest<T>('query', 'GET', { query: queryString });
  }
  
  /**
   * Get company info from QBO
   */
  async getCompanyInfo(): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: "User must be logged in to get company info" };
      }
      
      // Call the test connection edge function to get company info
      const { data, error } = await supabase.functions.invoke('qbo-test-connection', {
        body: { userId: user.id }
      });
      
      if (error || !data.success) {
        return { 
          success: false, 
          error: error?.message || data?.error || 'Unknown error'
        };
      }
      
      return {
        success: true,
        data: data.companyInfo
      };
    } catch (err) {
      console.error("Error getting QBO company info:", err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error' 
      };
    }
  }
}
