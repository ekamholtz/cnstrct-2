import axios, { AxiosInstance } from "axios";
import { QBOConfig } from "../../config/qboConfig";
import { QBOTokenManager } from "../../auth/qboTokenManager";
import https from 'https';

/**
 * Factory for creating authenticated QBO API clients
 */
export class APIClientFactory {
  private config: QBOConfig;
  private tokenManager: QBOTokenManager;
  private proxyUrl: string;
  
  constructor() {
    // Use the singleton instance to ensure consistent configuration
    this.config = QBOConfig.getInstance();
    this.tokenManager = new QBOTokenManager();
    // Use local CORS proxy for development
    this.proxyUrl = "http://localhost:3030/proxy";
  }
  
  /**
   * Get an authenticated API client for QBO
   */
  async createClient(connectionId: string, companyId: string): Promise<AxiosInstance> {
    try {
      // Use the token manager to refresh the token
      const token = await this.tokenManager.refreshToken(connectionId);
      
      // Create a proxy-based client that routes all requests through the CORS proxy
      const client = axios.create({
        baseURL: `${this.config.apiBaseUrl}/company/${companyId}`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        // Disable SSL verification for development
        httpsAgent: new https.Agent({
          rejectUnauthorized: false
        })
      });
      
      // Override the request method to route through the proxy
      const originalRequest = client.request;
      client.request = async function(config) {
        try {
          // Extract the relative URL from the full URL
          const baseUrlLength = `${this.defaults.baseURL}`.length;
          const relativeUrl = config.url?.startsWith('/') 
            ? config.url.substring(1) 
            : config.url;
          
          // For GET requests with query parameters
          if (config.method?.toLowerCase() === 'get' && config.params) {
            // Use the company-info proxy endpoint for all GET requests
            const proxyResponse = await axios.post(`${this.proxyUrl}/company-info`, {
              accessToken: token,
              realmId: companyId,
              endpoint: relativeUrl,
              params: config.params
            });
            return { data: proxyResponse.data, status: 200, statusText: 'OK', headers: {}, config };
          }
          
          // For POST/PUT/DELETE requests
          // Create a new proxy endpoint for data operations
          const proxyResponse = await axios.post(`${this.proxyUrl}/data-operation`, {
            accessToken: token,
            realmId: companyId,
            endpoint: relativeUrl,
            method: config.method,
            data: config.data
          });
          return { data: proxyResponse.data, status: 200, statusText: 'OK', headers: {}, config };
        } catch (error) {
          console.error("Error in proxy request:", error);
          throw error;
        }
      }.bind({
        defaults: client.defaults,
        proxyUrl: this.proxyUrl
      });
      
      return client;
    } catch (error) {
      console.error("Error creating QBO client:", error);
      throw new Error("Failed to create QBO client");
    }
  }
}
