import axios from "axios";
import { QBOConnectionService } from "./connection/qboConnectionService";

/**
 * Simplified QBO service that uses the CORS proxy for API calls
 * This is specifically for browser-based API calls that need to avoid CORS issues
 */
export class QBOProxyService {
  private proxyUrl: string;
  private connectionService: QBOConnectionService;
  
  constructor() {
    this.proxyUrl = "http://localhost:3030/proxy";
    this.connectionService = new QBOConnectionService();
    console.log("QBOProxyService initialized with proxy URL:", this.proxyUrl);
  }
  
  /**
   * Get user's QBO connection
   */
  async getUserConnection() {
    return this.connectionService.getConnection();
  }
  
  /**
   * Test connection to QBO using the CORS proxy
   */
  async testConnection() {
    try {
      // Get connection details
      const connection = await this.getUserConnection();
      
      if (!connection) {
        throw new Error("No QuickBooks connection found");
      }
      
      // Use the CORS proxy to test the connection
      const response = await axios.post(`${this.proxyUrl}/test-connection`, {
        accessToken: connection.access_token,
        refreshToken: connection.refresh_token,
        realmId: connection.company_id
      });
      
      // If we got a new access token from the proxy, update the connection
      if (response.data.newAccessToken) {
        console.log('Received new access token from proxy, updating connection');
        
        try {
          // Update the connection in the database
          await this.connectionService.updateConnection({
            ...connection,
            access_token: response.data.newAccessToken,
            refresh_token: response.data.newRefreshToken || connection.refresh_token
          });
        } catch (updateError) {
          console.error('Error updating connection with new tokens:', updateError);
        }
      }
      
      return {
        success: true,
        status: response.status,
        data: response.data
      };
    } catch (error) {
      console.error("Error testing QBO connection:", error);
      return {
        success: false,
        error: error
      };
    }
  }
}
