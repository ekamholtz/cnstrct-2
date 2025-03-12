
/**
 * Utility functions for QBO integration
 */
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
    localStorage.setItem('qbo_auth_state', state);
    localStorage.setItem('qbo_auth_user_id', userId);
  }

  /**
   * Clear OAuth state from localStorage
   */
  static clearOAuthState(): void {
    localStorage.removeItem('qbo_auth_state');
    localStorage.removeItem('qbo_auth_user_id');
  }

  /**
   * Validate OAuth state to prevent CSRF attacks
   */
  static validateState(providedState: string): boolean {
    const storedState = localStorage.getItem('qbo_auth_state');
    return providedState === storedState;
  }
}
