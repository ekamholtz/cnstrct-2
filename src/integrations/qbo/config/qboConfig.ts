import { supabase } from "@/integrations/supabase/client";

/**
 * Configuration for QuickBooks Online integration
 * This class provides a singleton pattern to ensure consistent configuration across the application.
 */
export class QBOConfig {
  // Client credentials
  public clientId: string;
  public clientSecret: string;
  public redirectUri: string;
  
  // API endpoints
  public authEndpoint: string;
  public tokenEndpoint: string;
  public apiBaseUrl: string;

  // Required OAuth scopes
  public scopes: string[];
  
  // Environment detection
  public isProduction: boolean;
  
  // Singleton instance
  private static instance: QBOConfig;
  
  /**
   * Get singleton instance to prevent multiple configurations with different values
   */
  public static getInstance(): QBOConfig {
    if (!QBOConfig.instance) {
      QBOConfig.instance = new QBOConfig();
    }
    return QBOConfig.instance;
  }
  
  constructor() {
    // Environment detection - ignore preview prefix
    const hostname = typeof window !== 'undefined' ? window.location.hostname.replace('preview--', '') : '';
    this.isProduction = hostname !== 'localhost' && 
                       !hostname.includes('127.0.0.1');
    
    console.log("QBOConfig constructor - hostname:", hostname);
    console.log("QBOConfig constructor - isProduction:", this.isProduction);
    
    // For client-side, we only need the client ID, not the secret
    if (this.isProduction) {
      // Production client ID - this is safe to expose
      this.clientId = "ABBj3cN2qzHyAjRg2Htq5BvstIO0HT79PmrHDNLBTdLKMirQr6";
      // Secret will be handled by the server-side proxy
      this.clientSecret = "";
    } else {
      // Sandbox client ID - this is safe to expose
      this.clientId = "AB6pN0pnXfsEqiCl1S03SYSdoRISCVD2ZQDxDgR4yYvbDdEx4j";
      // Secret will be handled by the server-side proxy
      this.clientSecret = "";
    }
    
    // Update redirect URI logic to include www.cnstrctnetwork.com
    if (hostname === 'cnstrctnetwork.vercel.app') {
      this.redirectUri = "https://cnstrctnetwork.vercel.app/qbo/callback";
    } else if (hostname.includes('cnstrctnetwork-') && hostname.includes('vercel.app')) {
      this.redirectUri = "https://cnstrctnetwork.vercel.app/qbo/callback";
    } else if (hostname === 'cnstrct-2.lovable.app') {
      this.redirectUri = "https://cnstrct-2.lovable.app/qbo/callback";
    } else if (hostname === 'www.cnstrctnetwork.com') {
      this.redirectUri = "https://www.cnstrctnetwork.com/qbo/callback";
    } else if (hostname === 'localhost' || hostname.includes('127.0.0.1')) {
      const port = typeof window !== 'undefined' ? window.location.port : '8081';
      this.redirectUri = `http://localhost:${port}/qbo/callback`;
    } else {
      // Fallback to the production URI
      this.redirectUri = "https://www.cnstrctnetwork.com/qbo/callback";
    }
    
    console.log("Using QBO redirect URI:", this.redirectUri);
    
    // Use the simplest scope format for QuickBooks API
    this.scopes = ['com.intuit.quickbooks.accounting'];

    // Use correct endpoints based on environment
    this.authEndpoint = 'https://appcenter.intuit.com/connect/oauth2';
    
    // Use the v1 token endpoint which has better compatibility
    this.tokenEndpoint = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
    
    // Use the correct API base URL based on environment
    if (this.isProduction) {
      // Production QBO API
      this.apiBaseUrl = 'https://quickbooks.api.intuit.com/v3';
    } else {
      // Sandbox QBO API
      this.apiBaseUrl = 'https://sandbox-quickbooks.api.intuit.com/v3';
    }
    
    console.log("QBOConfig Initialization Complete");
    console.log({
      clientId: this.clientId,
      redirectUri: this.redirectUri,
      environment: this.isProduction ? "Production" : "Sandbox",
      apiBaseUrl: this.apiBaseUrl
    });
  }
  
  /**
   * Get the proxy URL appropriate for the current environment
   */
  public getProxyUrl(): string {
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
}
