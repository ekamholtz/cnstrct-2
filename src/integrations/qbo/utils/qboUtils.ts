
/**
 * Utility functions for QBO integration
 */
import { QBOSessionHelper } from "./qboSessionHelper";

export class QBOUtils {
  /**
   * Generate a random state parameter for OAuth
   */
  static generateRandomState(): string {
    const array = new Uint8Array(32); // Increased from 16 to 32 for more security
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Store OAuth state in multiple storage locations for redundancy
   */
  static storeOAuthState(state: string, userId: string): void {
    // Store state in multiple places for redundancy
    try {
      localStorage.setItem('qbo_auth_state', state);
      sessionStorage.setItem('qbo_auth_state', state);
      
      // Also store as a cookie for better cross-domain handling
      const secure = window.location.protocol === 'https:' ? 'Secure;' : '';
      document.cookie = `qbo_auth_state=${state}; path=/; max-age=3600; SameSite=Lax; ${secure}`;
      
      // Store user ID for later reference
      localStorage.setItem('qbo_auth_user_id', userId);
      sessionStorage.setItem('qbo_auth_user_id', userId);
      
      // Use the enhanced session helper to backup auth state
      QBOSessionHelper.backupAuthSession(userId);
      
      console.log("Stored QBO OAuth state and backed up auth session");
    } catch (error) {
      console.error("Error storing QBO OAuth state:", error);
    }
  }

  /**
   * Clear OAuth state from all storage mechanisms
   */
  static clearOAuthState(): void {
    try {
      // Clear from all storage mechanisms
      localStorage.removeItem('qbo_auth_state');
      localStorage.removeItem('qbo_auth_user_id');
      
      sessionStorage.removeItem('qbo_auth_state');
      sessionStorage.removeItem('qbo_auth_user_id');
      
      document.cookie = "qbo_auth_state=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      
      console.log("Cleared QBO OAuth state from all storage mechanisms");
    } catch (error) {
      console.error("Error clearing QBO OAuth state:", error);
    }
  }
  
  /**
   * Get stored state from any available storage mechanism
   */
  static getStoredState(): string | null {
    try {
      // Try localStorage first
      let storedState = localStorage.getItem('qbo_auth_state');
      
      // If not found, try sessionStorage
      if (!storedState) {
        storedState = sessionStorage.getItem('qbo_auth_state');
      }
      
      // If still not found, try cookies
      if (!storedState) {
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
          const [name, value] = cookie.trim().split('=');
          if (name === 'qbo_auth_state') {
            storedState = value;
            break;
          }
        }
      }
      
      return storedState;
    } catch (error) {
      console.error("Error retrieving QBO OAuth state:", error);
      return null;
    }
  }

  /**
   * Validate OAuth state to prevent CSRF attacks
   */
  static validateState(providedState: string): boolean {
    if (!providedState) {
      console.error("No state provided for validation");
      return false;
    }
    
    const storedState = this.getStoredState();
    
    // Log state comparison for debugging
    console.log("QBO OAuth state validation:", {
      providedState,
      storedState,
      match: providedState === storedState
    });
    
    return providedState === storedState;
  }
  
  /**
   * Get stored user ID from any storage mechanism
   */
  static getStoredUserId(): string | null {
    try {
      // Try localStorage first
      let userId = localStorage.getItem('qbo_auth_user_id');
      
      // If not found, try sessionStorage
      if (!userId) {
        userId = sessionStorage.getItem('qbo_auth_user_id');
      }
      
      return userId;
    } catch (error) {
      console.error("Error retrieving QBO OAuth user ID:", error);
      return null;
    }
  }
}
