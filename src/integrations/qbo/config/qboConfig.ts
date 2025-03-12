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
    
    // Strip preview prefix from origin if present
    const origin = window.location.origin.replace('preview--', '');
    this.redirectUri = `${origin}/qbo/callback`;
    this.scopes = [
      'com.intuit.quickbooks.accounting',
      'com.intuit.quickbooks.payment',
    ];

    // Use correct endpoints based on environment
    this.authEndpoint = 'https://appcenter.intuit.com/connect/oauth2';
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
      redirectUri: this.redirectUri
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
