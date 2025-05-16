
/**
 * Simplified QBO configuration class
 */
export class QBOConfig {
  private static instance: QBOConfig;
  
  // Client ID - Read from environment or use default sandbox value
  readonly clientId: string;
  
  // OAuth endpoints
  readonly authEndpoint: string = 'https://appcenter.intuit.com/connect/oauth2';
  readonly tokenEndpoint: string = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
  
  // API base URL
  readonly apiBaseUrl: string;
  
  // Production vs Sandbox mode
  readonly isProduction: boolean;
  
  // Scopes requested for QBO access
  readonly scopes: string[] = ['com.intuit.quickbooks.accounting'];
  
  // Redirect URI for OAuth callback
  readonly redirectUri: string;
  
  // Client secret for token requests
  readonly clientSecret: string;
  
  /**
   * Private constructor
   */
  private constructor() {
    const hostname = window.location.hostname;
    
    // Determine if we're in production based on hostname
    this.isProduction = hostname === 'www.cnstrctnetwork.com' ||
                       hostname === 'cnstrctnetwork.com';
    
    // Set client ID based on environment
    this.clientId = import.meta.env.VITE_QBO_SANDBOX_CLIENT_ID || '';
    this.clientSecret = import.meta.env.VITE_QBO_SANDBOX_CLIENT_SECRET || '';

    // Set API base URL based on environment
    this.apiBaseUrl = this.isProduction
      ? 'https://quickbooks.api.intuit.com/v3'
      : 'https://sandbox-quickbooks.api.intuit.com/v3';
    
    // Set the redirect URI
    const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_REF || 'wkspjzbybjhvscqdmpwi';
    this.redirectUri = `https://${projectRef}.supabase.co/functions/v1/qbo-oauth-callback`;
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
