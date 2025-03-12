
import axios, { AxiosInstance } from "axios";
import { QBOAuthService } from "../authService";
import { supabase } from "@/integrations/supabase/client";

export class BaseQBOService {
  protected authService: QBOAuthService;
  protected baseUrl: string;
  
  constructor() {
    this.authService = new QBOAuthService();
    // Use sandbox URL for development, production URL for production
    this.baseUrl = "https://sandbox-quickbooks.api.intuit.com/v3";
  }
  
  /**
   * Get an authenticated API client for QBO
   */
  async getClient(connectionId: string, companyId: string): Promise<AxiosInstance> {
    try {
      // Get a fresh token
      const token = await this.authService.refreshToken(connectionId);
      
      // Create and return axios instance
      return axios.create({
        baseURL: `${this.baseUrl}/company/${companyId}`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error("Error getting QBO client:", error);
      throw new Error("Failed to create QBO client");
    }
  }
  
  /**
   * Get user's QBO connection
   */
  async getUserConnection() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }
    
    const { data: connection, error } = await supabase
      .from('qbo_connections')
      .select('*')
      .eq('user_id', user.id)
      .single();
      
    if (error || !connection) {
      return null;
    }
    
    return connection;
  }
}
