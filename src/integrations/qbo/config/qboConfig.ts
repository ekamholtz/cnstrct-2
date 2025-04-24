/**
 * Singleton configuration class for QBO integration
 */
export class QBOConfig {
  private static instance: QBOConfig;
  
  // Client ID - Read from environment or use default sandbox value
  readonly clientId: string;
  
  // OAuth endpoints
  readonly authEndpoint: string = 'https://appcenter.intuit.com/connect/oauth2';
  readonly tokenEndpoint: string = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
  
  // API endpoints
  readonly apiBaseUrl: string;
  
  // Production vs Sandbox mode
  readonly isProduction: boolean;
  
  // Scopes requested for QBO access
  readonly scopes: string[] = ['com.intuit.quickbooks.accounting'];
  
  // Redirect URI for OAuth callback
  readonly redirectUri: string;
  
  // For token refresh requests
  readonly clientSecret: string;
  
  /**
   * Private constructor to prevent direct instantiation
   */
  private constructor() {
    const hostname = window.location.hostname;
    
    // Determine if we're in production or development mode
    // Consider Lovable preview URLs as development environment
    this.isProduction = hostname === 'www.cnstrctnetwork.com';
    
    // Set client ID based on environment
    this.clientId = import.meta.env.VITE_QBO_CLIENT_ID || 'ABBj3cN2qzHyAjRg2Htq5BvstIO0HT79PmrHDNLBTdLKMirQr6';
    
    // Add placeholder for clientSecret
    this.clientSecret = import.meta.env.VITE_QBO_CLIENT_SECRET || '';
    
    // Set API base URL based on environment
    this.apiBaseUrl = this.isProduction
      ? 'https://quickbooks.api.intuit.com/v3'
      : 'https://sandbox-quickbooks.api.intuit.com/v3';
    
    // Set the redirect URI based on current hostname
    this.redirectUri = `${window.location.origin}/qbo/callback`;
    
    console.log("QBO Config initialized:", {
      mode: this.isProduction ? "Production" : "Development",
      hostname,
      clientId: this.clientId,
      redirectUri: this.redirectUri,
      apiBaseUrl: this.apiBaseUrl
    });
  }
  
  /**
   * Get singleton instance of QBOConfig
   */
  public static getInstance(): QBOConfig {
    if (!QBOConfig.instance) {
      QBOConfig.instance = new QBOConfig();
    }
    
    return QBOConfig.instance;
  }
}
