
/**
 * Utility functions for QBO integration
 */
export class QBOUtils {
  /**
   * Validate the state parameter from OAuth callback
   */
  public static validateState(state: string): boolean {
    // For now, return true for testing
    return true;
  }
  
  /**
   * Get stored user ID 
   */
  public static getStoredUserId(): string | null {
    // Return the user ID from session storage
    return sessionStorage.getItem('qbo_user_id');
  }
  
  /**
   * Store OAuth state
   */
  public static storeOAuthState(state: string): void {
    localStorage.setItem('qbo_auth_state', state);
  }
  
  /**
   * Clear OAuth state
   */
  public static clearOAuthState(): void {
    localStorage.removeItem('qbo_auth_state');
  }
}
