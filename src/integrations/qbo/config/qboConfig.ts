
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
  
  // Scopes requested for QBO access - accounting scope is needed for QBO
  readonly scopes: string[] = ['com.intuit.quickbooks.accounting'];
  
  // Redirect URI for OAuth callback
  readonly redirectUri: string;
  
  // For token refresh requests
  readonly clientSecret: string;
  
  /**
   * Private constructor to prevent direct instantiation
   */
  private constructor() {
    // Determine if we're in production or sandbox mode by checking the domain
    // Local development always uses sandbox mode
    const isDev = 
      window.location.hostname === 'localhost' || 
      window.location.hostname.includes('127.0.0.1') ||
      window.location.hostname.includes('localhost') || 
      window.location.hostname.includes('.vercel.app') ||
      window.location.hostname.includes('.lovableproject.com');
      
    this.isProduction = !isDev;
    
    // Set client ID based on environment
    this.clientId = import.meta.env.VITE_QBO_CLIENT_ID || 'ABBj3cN2qzHyAjRg2Htq5BvstIO0HT79PmrHDNLBTdLKMirQr6';
    
    // Add placeholder for clientSecret (this should come from environment variables in a real app)
    this.clientSecret = import.meta.env.VITE_QBO_CLIENT_SECRET || '';
    
    // Set API base URL based on environment
    this.apiBaseUrl = this.isProduction
      ? 'https://quickbooks.api.intuit.com/v3'
      : 'https://sandbox-quickbooks.api.intuit.com/v3';
    
    // IMPORTANT: Use hardcoded redirect URIs that match EXACTLY what's registered in Intuit Developer Portal
    // For sandbox/development environments
    const sandboxRedirectUri = "https://cnstrctnetwork.vercel.app/qbo/callback";
    
    // For production
    const productionRedirectUri = "https://www.cnstrctnetwork.com/qbo/callback";
    
    // Set the redirect URI based on environment
    this.redirectUri = this.isProduction ? productionRedirectUri : sandboxRedirectUri;
    
    console.log("QBO Config initialized:", {
      mode: this.isProduction ? "Production" : "Development",
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
