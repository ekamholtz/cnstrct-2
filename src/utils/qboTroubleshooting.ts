
/**
 * QBO Troubleshooting Utilities
 * Provides diagnostic tools for QBO integration issues
 */
export class QBOTroubleshooting {
  /**
   * Get diagnostic info for troubleshooting QBO connection issues
   */
  static async getDiagnosticInfo(): Promise<any> {
    try {
      // Collect environmental information
      const info = {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'unknown',
        currentUrl: window.location.href,
        currentHostname: window.location.hostname,
        userAgent: navigator.userAgent,
        language: navigator.language,
        cookiesEnabled: navigator.cookieEnabled,
        localStorageAvailable: this.checkLocalStorage(),
        hasAuthSession: await this.hasValidAuthSession(),
        popupsBlocked: await this.testPopupBlocking(),
        localStorageItems: this.getQBOStorageItems(),
        // Add more diagnostic info as needed
      };
      
      console.log("QBO Diagnostic Info:", info);
      return info;
    } catch (error) {
      console.error("Error getting diagnostic info:", error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }
  
  /**
   * Log diagnostic information to the console
   */
  static logDiagnosticInfo(): void {
    this.getDiagnosticInfo().then(info => {
      console.log("QBO Diagnostic Info:", info);
    });
  }
  
  /**
   * Clear all QBO related data from local storage
   */
  static clearAllQBOData(): void {
    try {
      // Clear QBO specific localStorage items
      localStorage.removeItem('qbo_auth_state');
      localStorage.removeItem('qbo_auth_user_id');
      localStorage.removeItem('qbo_session_data');
      localStorage.removeItem('qbo_last_connection_time');
      
      // Clear all items with 'qbo' prefix
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('qbo_')) {
          localStorage.removeItem(key);
        }
      });
      
      console.log("All QBO data cleared from local storage");
    } catch (error) {
      console.error("Error clearing QBO data:", error);
    }
  }
  
  /**
   * Check if local storage is available
   */
  private static checkLocalStorage(): boolean {
    try {
      const testKey = 'qbo_test_key';
      localStorage.setItem(testKey, 'test');
      const result = localStorage.getItem(testKey) === 'test';
      localStorage.removeItem(testKey);
      return result;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Check if user has a valid auth session
   */
  private static async hasValidAuthSession(): Promise<boolean> {
    try {
      // This is a simplified check - it doesn't actually validate if the token is valid
      // Just checks if something that looks like a session exists
      const hasSession = !!localStorage.getItem('supabase.auth.token');
      return hasSession;
    } catch (error) {
      console.error("Error checking auth session:", error);
      return false;
    }
  }
  
  /**
   * Test if popups are blocked
   */
  private static async testPopupBlocking(): Promise<boolean> {
    try {
      const popup = window.open('about:blank', 'test_popup', 'width=1,height=1');
      const blocked = !popup || popup.closed || typeof popup.closed === 'undefined';
      if (popup) popup.close();
      return blocked;
    } catch (error) {
      return true; // If there's an error, assume popups are blocked
    }
  }
  
  /**
   * Get all QBO related items from localStorage
   */
  private static getQBOStorageItems(): Record<string, string> {
    const items: Record<string, string> = {};
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('qbo_')) {
          // Only include the keys, not the values for security
          items[key] = '[REDACTED]';
        }
      });
    } catch (error) {
      console.error("Error reading localStorage:", error);
    }
    return items;
  }
}
