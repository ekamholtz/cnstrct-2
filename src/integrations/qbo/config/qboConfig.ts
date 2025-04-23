
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
  
  // Production vs Sandbox mode
  readonly isProduction: boolean;
  
  // Scopes requested for QBO access - accounting scope is needed for QBO
  readonly scopes: string[] = ['com.intuit.quickbooks.accounting'];
  
  // Redirect URI for OAuth callback
  readonly redirectUri: string;
  
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
    
    // Build the correct redirect URI based on current domain
    const baseUrl = window.location.origin;
    
    // For production, use fixed production domain to match registered redirect URI with Intuit
    const prodDomain = 'https://www.cnstrctnetwork.com';
    
    // In dev, redirect locally; in production use registered domain
    this.redirectUri = this.isProduction 
      ? `${prodDomain}/qbo/callback` 
      : `${baseUrl}/qbo/callback`;
    
    console.log("QBO Config initialized:", {
      mode: this.isProduction ? "Production" : "Development",
      clientId: this.clientId,
      redirectUri: this.redirectUri
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
