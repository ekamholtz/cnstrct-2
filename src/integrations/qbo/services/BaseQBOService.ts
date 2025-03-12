
import { AuthorizationService } from "./auth/AuthorizationService";
import { APIClientFactory } from "./api/APIClientFactory";
import { ConnectionManager } from "./connection/ConnectionManager";
import { QBOConfig } from "../config/qboConfig";

export class BaseQBOService {
  protected authService: AuthorizationService;
  protected apiClientFactory: APIClientFactory;
  protected connectionManager: ConnectionManager;
  protected baseUrl: string;
  
  constructor() {
    this.authService = new AuthorizationService();
    this.apiClientFactory = new APIClientFactory();
    this.connectionManager = new ConnectionManager();
    
    // Get configuration
    const config = new QBOConfig();
    this.baseUrl = config.apiBaseUrl;
      
    console.log("BaseQBOService initialized with baseUrl:", this.baseUrl);
  }
  
  /**
   * Get an authenticated API client for QBO
   */
  async getClient(connectionId: string, companyId: string) {
    return this.apiClientFactory.createClient(connectionId, companyId);
  }
  
  /**
   * Get user's QBO connection
   */
  async getUserConnection() {
    return this.connectionManager.getUserConnection();
  }
}
