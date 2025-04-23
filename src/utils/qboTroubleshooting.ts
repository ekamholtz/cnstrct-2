
/**
 * Utilities for QBO troubleshooting
 */
import { QBOConfig } from "@/integrations/qbo/config/qboConfig";

interface QBODiagnosticInfo {
  environment: string;
  clientId: string;
  redirectUri: string;
  authUrl: string;
  currentUrl: string;
  currentOrigin: string;
  currentHostname: string;
  qboScopes: string[];
  popupsBlocked: boolean | null;
  cookiesEnabled: boolean;
  localStorageAvailable: boolean;
  hasAuthSession: boolean;
}

export class QBOTroubleshooting {
  /**
   * Get diagnostic information for QBO integration
   */
  static async getDiagnosticInfo(): Promise<QBODiagnosticInfo> {
    const config = QBOConfig.getInstance();
    
    // Test if popups are blocked
    let popupsBlocked: boolean | null = null;
    try {
      const testPopup = window.open('', '_blank', 'width=1,height=1');
      if (!testPopup || testPopup.closed || typeof testPopup.closed === 'undefined') {
        popupsBlocked = true;
      } else {
        popupsBlocked = false;
        testPopup.close();
      }
    } catch (e) {
      console.error("Error testing popups:", e);
    }
    
    // Test if cookies are enabled
    let cookiesEnabled = true;
    try {
      document.cookie = "qbo_cookie_test=1";
      cookiesEnabled = document.cookie.indexOf("qbo_cookie_test=") !== -1;
      document.cookie = "qbo_cookie_test=1; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    } catch (e) {
      cookiesEnabled = false;
    }
    
    // Test if localStorage is available
    let localStorageAvailable = false;
    try {
      localStorage.setItem("qbo_localstorage_test", "1");
      localStorage.removeItem("qbo_localstorage_test");
      localStorageAvailable = true;
    } catch (e) {
      localStorageAvailable = false;
    }
    
    // Check for any stored QBO auth state
    const hasAuthSession = !!(
      localStorage.getItem('qbo_auth_state') || 
      sessionStorage.getItem('qbo_auth_state') || 
      document.cookie.indexOf('qbo_auth_state=') !== -1
    );
    
    // Generate auth URL example
    const state = "sample_state_123";
    const authUrl = `${config.authEndpoint}?client_id=${config.clientId}&response_type=code&scope=${encodeURIComponent(config.scopes.join(' '))}&redirect_uri=${encodeURIComponent(config.redirectUri)}&state=${state}`;
    
    return {
      environment: config.isProduction ? "Production" : "Development",
      clientId: config.clientId,
      redirectUri: config.redirectUri,
      authUrl: authUrl,
      currentUrl: window.location.href,
      currentOrigin: window.location.origin,
      currentHostname: window.location.hostname,
      qboScopes: config.scopes,
      popupsBlocked,
      cookiesEnabled,
      localStorageAvailable,
      hasAuthSession
    };
  }
  
  /**
   * Check if the redirect URI is correctly configured
   */
  static isRedirectUriConfigured(): boolean {
    const config = QBOConfig.getInstance();
    
    // Check if the URI uses https
    if (!config.redirectUri.startsWith('https://')) {
      console.warn("QBO redirect URI should use HTTPS in production");
      if (config.isProduction) {
        return false;
      }
    }
    
    // Check if URI is empty
    if (!config.redirectUri) {
      console.error("QBO redirect URI is empty");
      return false;
    }
    
    return true;
  }
  
  /**
   * Clear all QBO auth data from storage
   */
  static clearAllQBOData(): void {
    try {
      // Clear localStorage items
      const localStorageKeys = Object.keys(localStorage);
      localStorageKeys.forEach(key => {
        if (key.includes('qbo_')) {
          localStorage.removeItem(key);
        }
      });
      
      // Clear sessionStorage items
      const sessionStorageKeys = Object.keys(sessionStorage);
      sessionStorageKeys.forEach(key => {
        if (key.includes('qbo_')) {
          sessionStorage.removeItem(key);
        }
      });
      
      // Clear cookies
      document.cookie = "qbo_auth_state=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;";
      
      console.log("All QBO auth data cleared from browser storage");
    } catch (e) {
      console.error("Error clearing QBO data:", e);
    }
  }
}
