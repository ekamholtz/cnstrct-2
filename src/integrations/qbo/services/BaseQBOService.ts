
import axios, { AxiosInstance } from "axios";
import { QBOAuthService } from "../authService";
import { supabase } from "@/integrations/supabase/client";
import { QBOConfig } from "../config/qboConfig";

export class BaseQBOService {
  protected authService: QBOAuthService;
  protected baseUrl: string;
  
  constructor() {
    this.authService = new QBOAuthService();
    
    // Get configuration
    const config = new QBOConfig();
    this.baseUrl = config.apiBaseUrl;
      
    console.log("BaseQBOService initialized with baseUrl:", this.baseUrl);
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
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log("User not authenticated when getting QBO connection");
        throw new Error("User not authenticated");
      }
      
      const { data: connection, error } = await supabase
        .from('qbo_connections')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (error) {
        console.log("No QBO connection found for user", user.id);
        return null;
      }
      
      return connection;
    } catch (error) {
      console.error("Error getting user QBO connection:", error);
      return null;
    }
  }
}
