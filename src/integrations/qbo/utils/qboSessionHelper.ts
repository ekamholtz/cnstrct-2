/**
 * QBO Session Helper
 * 
 * This utility helps preserve authentication state during the QuickBooks Online OAuth flow
 * to prevent users from being logged out when connecting to QBO.
 */

import { supabase } from "@/integrations/supabase/client";

export class QBOSessionHelper {
  private static readonly AUTH_SESSION_KEY = 'supabase.auth.token';
  private static readonly QBO_SESSION_BACKUP_KEY = 'qbo_auth_session_backup';
  private static readonly QBO_USER_ID_KEY = 'qbo_auth_user_id';

  /**
   * Backup the current authentication session before redirecting to QBO
   */
  static backupAuthSession(userId?: string): void {
    try {
      // Store the user ID
      localStorage.setItem(this.QBO_USER_ID_KEY, userId);
      
      // Backup the current auth session
      const authSession = localStorage.getItem(this.AUTH_SESSION_KEY);
      if (authSession) {
        localStorage.setItem(this.QBO_SESSION_BACKUP_KEY, authSession);
        console.log('Successfully backed up auth session for QBO flow');
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
      const backupSession = localStorage.getItem(this.QBO_SESSION_BACKUP_KEY);
      const currentSession = localStorage.getItem(this.AUTH_SESSION_KEY);
      
      // If we have a backup but no current session, restore it
      if (backupSession && !currentSession) {
        localStorage.setItem(this.AUTH_SESSION_KEY, backupSession);
        console.log('Restored auth session from backup');
        
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
    }
  }

  /**
   * Get the user ID stored during the QBO flow
   */
  static getStoredUserId(): string | null {
    return localStorage.getItem(this.QBO_USER_ID_KEY);
  }

  /**
   * Clear all QBO session data
   */
  static clearSessionData(): void {
    localStorage.removeItem(this.QBO_SESSION_BACKUP_KEY);
    localStorage.removeItem(this.QBO_USER_ID_KEY);
  }
}
