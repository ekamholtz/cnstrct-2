
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
    
    // Match exactly what's registered in the Intuit Developer Portal
    const port = window.location.port ? `:${window.location.port}` : '';
    
    if (hostname === 'cnstrct-2.lovable.app') {
      this.redirectUri = "https://cnstrct-2.lovable.app/qbo/callback";
    } else if (hostname === 'localhost' || hostname.includes('127.0.0.1')) {
      // Use HTTP for localhost since that's what's registered in the portal
      if (port === ':8080') {
        this.redirectUri = "http://localhost:8080/qbo/callback";
      } else if (port === ':8081') {
        this.redirectUri = "http://localhost:8081/qbo/callback";
      } else {
        // Default to HTTPS format for localhost for security
        this.redirectUri = "https://localhost/qbo/callback";
      }
    } else {
      // Fallback to the dynamically generated URI with preview prefix removed
      const origin = window.location.origin.replace('preview--', '');
      this.redirectUri = `${origin}/qbo/callback`;
    }
    
    // Using ONLY the scopes that Intuit supports - no extra ones
    this.scopes = [
      'com.intuit.quickbooks.accounting',
      'com.intuit.quickbooks.payment'
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
      redirectUri: this.redirectUri,
      scopes: this.scopes
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
