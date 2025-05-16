
/**
 * Utility functions for QBO integration
 */
export class QBOUtils {
  /**
   * Validate the state parameter to prevent CSRF attacks
   */
  public static validateState(state: string): boolean {
    const storedState = localStorage.getItem('qbo_auth_state');
    return state === storedState;
  }
  
  /**
   * Get the stored user ID from localStorage
   */
  public static getStoredUserId(): string | null {
    return localStorage.getItem('qbo_auth_user_id');
  }
  
  /**
   * Store the state parameter and user ID in localStorage
   */
  public static storeOAuthState(state: string, userId: string): void {
    localStorage.setItem('qbo_auth_state', state);
    localStorage.setItem('qbo_auth_user_id', userId);
  }
  
  /**
   * Clear the OAuth state from localStorage
   */
  public static clearOAuthState(): void {
    localStorage.removeItem('qbo_auth_state');
    localStorage.removeItem('qbo_auth_user_id');
  }
}
