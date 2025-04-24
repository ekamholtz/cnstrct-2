
/**
 * Utility class for QBO troubleshooting
 */
export class QBOTroubleshooting {
  /**
   * Clear any stored QBO auth data from localStorage
   */
  static clearQBOAuthData(): void {
    localStorage.removeItem('qbo_auth_state');
    localStorage.removeItem('qbo_user_id');
    localStorage.removeItem('qbo_connection_id');
    
    console.log("QBO auth data cleared from localStorage");
  }
  
  /**
   * Clear all QBO related data from localStorage
   */
  static clearAllQBOData(): void {
    localStorage.removeItem('qbo_auth_state');
    localStorage.removeItem('qbo_user_id');
    localStorage.removeItem('qbo_connection_id');
    localStorage.removeItem('qbo_company_id');
    localStorage.removeItem('qbo_access_token');
    localStorage.removeItem('qbo_refresh_token');
    localStorage.removeItem('qbo_token_expires');
    
    console.log("All QBO data cleared from localStorage");
  }
  
  /**
   * Log diagnostic information about the current QBO configuration
   */
  static logDiagnosticInfo(): void {
    const hostname = window.location.hostname;
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    const href = window.location.href;
    
    console.group("QBO Diagnostic Information");
    console.log("Hostname:", hostname);
    console.log("Origin:", origin);
    console.log("Path:", pathname);
    console.log("Full URL:", href);
    console.log("User Agent:", navigator.userAgent);
    
    // Check if we're in development/sandbox mode
    const isSandboxMode = hostname === 'localhost' || 
                         hostname.includes('127.0.0.1') ||
                         hostname.includes('.vercel.app') ||
                         hostname.includes('.lovableproject.com');
    
    console.log("Environment:", isSandboxMode ? "Development (Sandbox)" : "Production");
    
    // Check for any stored QBO state
    const storedState = localStorage.getItem('qbo_auth_state');
    const storedUserId = localStorage.getItem('qbo_user_id');
    
    console.log("Stored QBO State:", storedState ? "Present" : "None");
    console.log("Stored User ID:", storedUserId ? "Present" : "None");
    
    console.groupEnd();
  }
  
  /**
   * Get comprehensive diagnostic information for QBO integration
   * @returns DiagnosticInfo object with all relevant details
   */
  static async getDiagnosticInfo(): Promise<any> {
    const hostname = window.location.hostname;
    const origin = window.location.origin;
    
    // Check if we're in development/sandbox mode
    const isSandboxMode = hostname === 'localhost' || 
                         hostname.includes('127.0.0.1') ||
                         hostname.includes('.vercel.app') ||
                         hostname.includes('.lovableproject.com');
    
    // Test if popups are blocked (basic check)
    let popupsBlocked = null;
    try {
      const popup = window.open('about:blank', 'popup_test', 'width=100,height=100');
      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        popupsBlocked = true;
      } else {
        popupsBlocked = false;
        popup.close();
      }
    } catch (e) {
      popupsBlocked = true;
    }
    
    // Test if cookies are enabled
    const cookiesEnabled = navigator.cookieEnabled;
    
    // Test if localStorage is available
    let localStorageAvailable = false;
    try {
      localStorage.setItem('qbo_test', 'test');
      localStorage.removeItem('qbo_test');
      localStorageAvailable = true;
    } catch (e) {
      localStorageAvailable = false;
    }
    
    // Get all stored QBO data
    const storedState = localStorage.getItem('qbo_auth_state');
    const storedUserId = localStorage.getItem('qbo_user_id');
    const storedConnectionId = localStorage.getItem('qbo_connection_id');
    
    return {
      environment: isSandboxMode ? "Development (Sandbox)" : "Production",
      clientId: 'REDACTED FOR SECURITY',  // Never expose actual client ID
      redirectUri: `${origin}/qbo/callback`,
      authUrl: 'https://appcenter.intuit.com/connect/oauth2',
      currentUrl: window.location.href,
      currentOrigin: origin,
      currentHostname: hostname,
      qboScopes: ['com.intuit.quickbooks.accounting', 'com.intuit.quickbooks.payment'],
      popupsBlocked,
      cookiesEnabled,
      localStorageAvailable,
      hasAuthSession: !!(storedState && storedUserId),
      timestamp: new Date().toISOString()
    };
  }
}
