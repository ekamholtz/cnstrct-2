/**
 * QBO Session Helper
 * 
 * This utility helps preserve authentication state during the QuickBooks Online OAuth flow
 * to prevent users from being logged out when connecting to QBO.
 */

import { supabase } from "@/integrations/supabase/client";

export class QBOSessionHelper {
  // The actual keys that Supabase uses for session storage
  private static readonly AUTH_SESSION_KEY = 'sb-wkspjzbybjhvscqdmpwi-auth-token';
  private static readonly LEGACY_AUTH_SESSION_KEY = 'supabase.auth.token'; 
  private static readonly QBO_SESSION_BACKUP_KEY = 'qbo_auth_session_backup';
  private static readonly QBO_USER_ID_KEY = 'qbo_auth_user_id';

  /**
   * Backup the current authentication session before redirecting to QBO
   */
  static backupAuthSession(userId?: string): void {
    try {
      if (!userId) {
        // Try to get user ID from the current session
        try {
          const session = JSON.parse(localStorage.getItem(this.AUTH_SESSION_KEY) || '{}');
          userId = session?.user?.id;
          console.log('Extracted user ID from current session:', userId);
        } catch (error) {
          console.warn('Could not extract user ID from session:', error);
        }
      }

      // Store the user ID in both localStorage and sessionStorage for redundancy
      if (userId) {
        localStorage.setItem(this.QBO_USER_ID_KEY, userId);
        sessionStorage.setItem(this.QBO_USER_ID_KEY, userId);
        console.log('Stored user ID for QBO flow:', userId);
      }
      
      // Backup the current auth session to both localStorage and sessionStorage
      // First check the new session format
      let authSession = localStorage.getItem(this.AUTH_SESSION_KEY);
      
      // If not found, try the legacy format
      if (!authSession) {
        authSession = localStorage.getItem(this.LEGACY_AUTH_SESSION_KEY);
        console.log('Using legacy auth session format');
      }
      
      if (authSession) {
        localStorage.setItem(this.QBO_SESSION_BACKUP_KEY, authSession);
        sessionStorage.setItem(this.QBO_SESSION_BACKUP_KEY, authSession);
        
        // Also store direct copy in the Supabase key for immediate use
        sessionStorage.setItem(this.AUTH_SESSION_KEY, authSession);
        
        console.log('Successfully backed up auth session for QBO flow');
        
        // Log session details (without sensitive data)
        try {
          const sessionData = JSON.parse(authSession);
          console.log('Session expiry:', sessionData?.expires_at ? new Date(sessionData.expires_at * 1000).toISOString() : 'unknown');
          console.log('Session user:', sessionData?.user?.id || 'unknown');
        } catch (error) {
          console.warn('Could not parse session for logging:', error);
        }
      } else {
        console.warn('No auth session found to backup');
      }
    } catch (err) {
      console.error('Error backing up auth session:', err);
    }
  }

  /**
   * Restore the authentication session if it was lost during the OAuth flow
   */
  static async restoreAuthSession(): Promise<boolean> {
    try {
      // Try to get the backup from various storage mechanisms
      const backupFromLocal = localStorage.getItem(this.QBO_SESSION_BACKUP_KEY);
      const backupFromSession = sessionStorage.getItem(this.QBO_SESSION_BACKUP_KEY);
      const backupSession = backupFromLocal || backupFromSession;
      
      // Check if current session exists
      const currentSessionFromLocal = localStorage.getItem(this.AUTH_SESSION_KEY);
      const currentSessionFromLegacy = localStorage.getItem(this.LEGACY_AUTH_SESSION_KEY);
      const currentSession = currentSessionFromLocal || currentSessionFromLegacy;
      
      console.log('Restore session check - backup exists:', !!backupSession);
      console.log('Restore session check - current exists:', !!currentSession);
      
      // If we have a backup but no current session, restore it
      if (backupSession && !currentSession) {
        // Restore to both the new and legacy keys
        localStorage.setItem(this.AUTH_SESSION_KEY, backupSession);
        sessionStorage.setItem(this.AUTH_SESSION_KEY, backupSession);
        
        // Also update the legacy key just in case
        localStorage.setItem(this.LEGACY_AUTH_SESSION_KEY, backupSession);
        
        console.log('Restored auth session from backup');
        
        // Extract the refresh token and try to refresh the session
        try {
          const sessionData = JSON.parse(backupSession);
          if (sessionData?.refresh_token) {
            console.log('Attempting to refresh the restored session');
            const { data, error } = await supabase.auth.refreshSession({
              refresh_token: sessionData.refresh_token
            });
            
            if (error) {
              console.error('Error refreshing session:', error);
            } else if (data?.session) {
              console.log('Successfully refreshed session for user:', data.user?.id);
              return true;
            }
          }
        } catch (error) {
          console.warn('Error parsing or refreshing session:', error);
        }
        
        // Verify the session is valid by getting the user
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          console.log('Successfully verified restored session for user:', data.user.id);
          return true;
        } else {
          console.warn('Restored session does not contain a valid user');
        }
      } else if (!backupSession) {
        console.warn('No backup session found to restore');
      } else {
        console.log('Current session exists, no need to restore');
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Error restoring auth session:', err);
      return false;
    } finally {
      // Clean up the backup after restoration attempt
      localStorage.removeItem(this.QBO_SESSION_BACKUP_KEY);
      sessionStorage.removeItem(this.QBO_SESSION_BACKUP_KEY);
    }
  }

  /**
   * Get the user ID stored during the QBO flow
   */
  static getStoredUserId(): string | null {
    // Try both localStorage and sessionStorage
    return localStorage.getItem(this.QBO_USER_ID_KEY) || 
           sessionStorage.getItem(this.QBO_USER_ID_KEY);
  }

  /**
   * Clear all QBO session data
   */
  static clearSessionData(): void {
    // Clear from both storage mechanisms
    localStorage.removeItem(this.QBO_SESSION_BACKUP_KEY);
    sessionStorage.removeItem(this.QBO_SESSION_BACKUP_KEY);
    localStorage.removeItem(this.QBO_USER_ID_KEY);
    sessionStorage.removeItem(this.QBO_USER_ID_KEY);
    console.log('Cleared all QBO session data');
  }
}
