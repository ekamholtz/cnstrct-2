
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
}
