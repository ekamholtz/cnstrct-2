/**
 * Utility functions for QBO integration
 */
import { QBOSessionHelper } from "./qboSessionHelper";

export class QBOUtils {
  /**
   * Generate a random state parameter for OAuth
   */
  static generateRandomState(): string {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Store OAuth state in localStorage
   */
  static storeOAuthState(state: string, userId: string): void {
    // Store state in multiple places for redundancy
    localStorage.setItem('qbo_auth_state', state);
    sessionStorage.setItem('qbo_auth_state', state);
    document.cookie = `qbo_auth_state=${state}; path=/; max-age=3600; SameSite=Lax`;
    
    // Use the enhanced session helper to backup auth state
    QBOSessionHelper.backupAuthSession(userId);
    
    console.log("Stored QBO OAuth state and backed up auth session");
  }

  /**
   * Clear OAuth state from localStorage
   */
  static clearOAuthState(): void {
    // Clear from all storage mechanisms
    localStorage.removeItem('qbo_auth_state');
    sessionStorage.removeItem('qbo_auth_state');
    document.cookie = "qbo_auth_state=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    
    // Do not clear the session backup until explicitly done in QBOSessionHelper
  }

  /**
   * Validate OAuth state to prevent CSRF attacks
   */
  static validateState(providedState: string): boolean {
    // Check multiple storage locations for the state parameter
    const storedStateFromLocal = localStorage.getItem('qbo_auth_state');
    const storedStateFromSession = sessionStorage.getItem('qbo_auth_state');
    
    // Try to get state from cookie
    const cookies = document.cookie.split(';');
    let storedStateFromCookie = null;
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'qbo_auth_state') {
        storedStateFromCookie = value;
        break;
      }
    }
    
    const storedState = storedStateFromLocal || storedStateFromSession || storedStateFromCookie;
    
    // Log state comparison for debugging
    console.log("QBO OAuth state validation:", {
      providedState,
      storedState,
      match: providedState === storedState
    });
    
    return providedState === storedState;
  }
}
