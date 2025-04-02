import { supabase } from "@/integrations/supabase/client";

/**
 * Service for interacting with the QBO Edge Function
 * This replaces the previous CORS proxy approach with Supabase Edge Functions
 */
export class QBOEdgeFunctionService {
  /**
   * Call the QBO Edge Function with the given action and data
   * @param action The action to perform
   * @param data The data to send
   * @returns The response from the Edge Function
   */
  async callEdgeFunction(action: string, data: any = {}) {
    try {
      // Get the JWT token for authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session found');
      }
      
      // Call the Edge Function
      const { data: response, error } = await supabase.functions.invoke('qbo-proxy', {
        body: { action, ...data },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      
      if (error) {
        console.error(`Error calling QBO Edge Function (${action}):`, error);
        throw error;
      }
      
      return response;
    } catch (error) {
      console.error(`Error in QBOEdgeFunctionService.callEdgeFunction (${action}):`, error);
      throw error;
    }
  }
  
  /**
   * Get the authorization URL for QBO OAuth flow
   * @returns The authorization URL
   */
  async getAuthorizationUrl() {
    try {
      const response = await this.callEdgeFunction('auth');
      return response.url;
    } catch (error) {
      console.error('Error getting QBO authorization URL:', error);
      throw error;
    }
  }
  
  /**
   * Handle the OAuth callback and exchange code for tokens
   * @param code The authorization code
   * @param state The state parameter
   * @param realmId The QBO company ID
   * @returns The result of the token exchange
   */
  async handleCallback(code: string, state: string, realmId: string) {
    try {
      const response = await this.callEdgeFunction('token', { code, state, realmId });
      return response;
    } catch (error) {
      console.error('Error handling QBO callback:', error);
      throw error;
    }
  }
  
  /**
   * Test the connection to QBO
   * @returns The result of the connection test
   */
  async testConnection() {
    try {
      const response = await this.callEdgeFunction('test-connection');
      return response;
    } catch (error) {
      console.error('Error testing QBO connection:', error);
      throw error;
    }
  }
  
  /**
   * Make a request to the QBO API
   * @param endpoint The API endpoint to call
   * @param method The HTTP method to use
   * @param body The request body (for POST/PUT requests)
   * @returns The response from the QBO API
   */
  async makeRequest(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', body: any = null) {
    try {
      const response = await this.callEdgeFunction('proxy', { endpoint, method, body });
      return response;
    } catch (error) {
      console.error(`Error making QBO request to ${endpoint}:`, error);
      throw error;
    }
  }
  
  /**
   * Disconnect from QBO
   * @returns The result of the disconnect operation
   */
  async disconnect() {
    try {
      const response = await this.callEdgeFunction('disconnect');
      return response.success;
    } catch (error) {
      console.error('Error disconnecting from QBO:', error);
      throw error;
    }
  }
  
  /**
   * Ping the QBO Edge Function to test connectivity
   * @returns The result of the ping operation
   */
  async ping() {
    try {
      const response = await this.callEdgeFunction('ping');
      return response;
    } catch (error) {
      console.error('Error pinging QBO Edge Function:', error);
      throw error;
    }
  }
}
