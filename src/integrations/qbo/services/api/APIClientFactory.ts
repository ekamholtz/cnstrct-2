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
    this.proxyUrl = this.getProxyUrl();
    
    console.log("APIClientFactory initialized with proxy URL:", this.proxyUrl);
  }
  
  /**
   * Get the appropriate proxy URL based on environment
   */
  private getProxyUrl(): string {
    if (typeof window === 'undefined') {
      return "/api/proxy";
    }
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname.includes('127.0.0.1')) {
      return "http://localhost:3030/proxy";
    }
    // For production, use the relative path to Vercel serverless functions
    return "/api/proxy";
  }
  
  /**
   * Get an authenticated API client for QBO
   */
  async createClient(connectionId: string, companyId: string): Promise<AxiosInstance> {
    try {
      // Use the token manager to refresh the token if needed
      const token = await this.tokenManager.refreshToken(connectionId);
      
      console.log("Creating QBO API client for company:", companyId);
      console.log("Using proxy URL:", this.proxyUrl);
      
      // Create a proxy-based client that routes all requests through the CORS proxy
      const client = axios.create({
        baseURL: `${this.config.apiBaseUrl}/company/${companyId}`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        // Only disable SSL verification for local development
        ...(this.isLocalDevelopment() && {
          httpsAgent: new https.Agent({
            rejectUnauthorized: false
          })
        })
      });
      
      // Override the request method to route through the proxy
      const originalRequest = client.request;
      const proxyUrl = this.proxyUrl; // Capture the proxy URL for use in the function
      
      client.request = async function(config) {
        try {
          // Extract the relative URL from the full URL
          const baseUrlLength = `${this.defaults.baseURL}`.length;
          const relativeUrl = config.url?.startsWith('/') 
            ? config.url.substring(1) 
            : config.url;
          
          // Skip the original request and use the proxy instead
          const proxyConfig = {
            url: `${proxyUrl}/data-operation`,
            method: 'post',
            data: {
              accessToken: token,
              realmId: companyId,
              endpoint: relativeUrl,
              method: config.method || 'get',
              data: config.data || null
            }
          };
          
          return await originalRequest.call(this, proxyConfig);
        } catch (error) {
          console.error("Error in proxied request:", error);
          throw error;
        }
      };
      
      return client;
    } catch (error) {
      console.error("Error creating QBO API client:", error);
      throw new Error(`Failed to create QBO API client: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Check if we're running in local development environment
   */
  private isLocalDevelopment(): boolean {
    if (typeof window === 'undefined') {
      return process.env.NODE_ENV === 'development';
    }
    const hostname = window.location.hostname;
    return hostname === 'localhost' || hostname.includes('127.0.0.1');
  }
}
