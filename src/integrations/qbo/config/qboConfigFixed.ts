import { supabase } from "@/integrations/supabase/client";

/**
 * Configuration for QuickBooks Online integration
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
  
  constructor() {
    // Environment detection - ignore preview prefix
    const hostname = window.location.hostname.replace('preview--', '');
    this.isProduction = hostname !== 'localhost' && 
                       !hostname.includes('127.0.0.1');
    
    // Updated sandbox credentials
    this.clientId = "AB6pN0pnXfsEqiCl1S03SYSdoRISCVD2ZQDxDgR4yYvbDdEx4j";
    this.clientSecret = "4zjveAX4tFhuxWx1sfgN3bE4zRVUquuFun3YqVau";
    
    // Use a hardcoded URL that exactly matches what's registered in the Intuit Developer Portal
    if (hostname === 'cnstrct-2.lovable.app') {
      this.redirectUri = "https://cnstrct-2.lovable.app/qbo/callback";
    } else if (hostname === 'localhost' || hostname.includes('127.0.0.1')) {
      // For local development, use the correct port (8081) and protocol (http)
      this.redirectUri = "http://localhost:8081/qbo/callback";
    } else {
      // Fallback to the dynamically generated URI with preview prefix removed
      const origin = window.location.origin.replace('preview--', '');
      this.redirectUri = `${origin}/qbo/callback`;
    }
    
    // Use the simplest scope format for QuickBooks API
    this.scopes = ['com.intuit.quickbooks.accounting'];

    // Use correct endpoints based on environment
    this.authEndpoint = 'https://appcenter.intuit.com/connect/oauth2';
    
    // Use the v1 token endpoint which has better compatibility
    this.tokenEndpoint = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
    
    // API base URL - switch between sandbox and production
    this.apiBaseUrl = this.isProduction 
      ? "https://quickbooks.api.intuit.com/v3"
      : "https://sandbox-quickbooks.api.intuit.com/v3";
      
    // Store the current user ID before redirect
    this.storeCurrentUserId();
    
    console.log("QBO Config initialized with:", {
      environment: this.isProduction ? "Production" : "Sandbox",
      apiBaseUrl: this.apiBaseUrl,
      clientId: this.clientId,
      redirectUri: this.redirectUri,
      scopes: this.scopes.join(' ')
    });
  }

  // Method to store the current user ID in localStorage
  private storeCurrentUserId(): void {
    // Get user from supabase without using await
    supabase.auth.getUser().then(({ data }) => {
      if (data && data.user) {
        localStorage.setItem('qbo_auth_user_id', data.user.id);
      }
    }).catch(error => {
      console.error("Error getting current user:", error);
    });
  }
}
