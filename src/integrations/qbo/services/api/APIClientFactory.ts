
import axios, { AxiosInstance } from "axios";
import { AuthorizationService } from "../auth/AuthorizationService";
import { QBOConfig } from "../../config/qboConfig";

/**
 * Factory for creating authenticated QBO API clients
 */
export class APIClientFactory {
  private authService: AuthorizationService;
  private config: QBOConfig;
  
  constructor() {
    this.authService = new AuthorizationService();
    this.config = new QBOConfig();
  }
  
  /**
   * Get an authenticated API client for QBO
   */
  async createClient(connectionId: string, companyId: string): Promise<AxiosInstance> {
    try {
      // Get a fresh token
      const token = await this.authService.refreshToken(connectionId);
      
      // Create and return axios instance
      return axios.create({
        baseURL: `${this.config.apiBaseUrl}/company/${companyId}`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error("Error creating QBO client:", error);
      throw new Error("Failed to create QBO client");
    }
  }
}
