
import { supabase } from '../supabase/client';
import { QBOConnection } from './types';

export class QBOConnectionService {
  /**
   * Get a QBO connection for a user
   * @param userId The user ID
   * @returns Promise resolving to the QBO connection or null
   */
  async getConnection(userId: string): Promise<QBOConnection | null> {
    try {
      const { data, error } = await supabase
        .from('qbo_connections')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (error) {
        if (error.code === 'PGRST116') { // Record not found
          return null;
        }
        throw error;
      }
      
      return data as QBOConnection;
    } catch (error) {
      console.error('Error getting QBO connection:', error);
      return null;
    }
  }
  
  /**
   * Save a QBO connection to the database
   * @param connection The QBO connection
   * @returns Promise resolving to the saved connection
   */
  async saveConnection(connection: QBOConnection): Promise<QBOConnection> {
    try {
      // Check if the connection already exists
      const { data: existingConn } = await supabase
        .from('qbo_connections')
        .select('id')
        .eq('user_id', connection.user_id)
        .maybeSingle();
        
      if (existingConn?.id) {
        // Update the existing connection
        const { error } = await supabase
          .from('qbo_connections')
          .update({
            access_token: connection.access_token,
            refresh_token: connection.refresh_token,
            token_type: connection.token_type,
            expires_in: connection.expires_in,
            realm_id: connection.realm_id,
            expires_at: connection.expires_at,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingConn.id);
          
        if (error) {
          throw error;
        }
        
        return { ...connection, id: existingConn.id };
      } else {
        // Create a new connection
        const { data, error } = await supabase
          .from('qbo_connections')
          .insert([{
            user_id: connection.user_id,
            gc_account_id: connection.gc_account_id,
            access_token: connection.access_token,
            refresh_token: connection.refresh_token,
            token_type: connection.token_type,
            expires_in: connection.expires_in,
            realm_id: connection.realm_id,
            created_at: connection.created_at,
            expires_at: connection.expires_at
          }])
          .select()
          .single();
          
        if (error) {
          throw error;
        }
        
        return data as QBOConnection;
      }
    } catch (error) {
      console.error('Error saving QBO connection:', error);
      throw error;
    }
  }
  
  /**
   * Delete a QBO connection
   * @param userId The user ID
   * @returns Promise resolving to boolean indicating success
   */
  async deleteConnection(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('qbo_connections')
        .delete()
        .eq('user_id', userId);
        
      if (error) {
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting QBO connection:', error);
      return false;
    }
  }
  
  /**
   * Refresh an OAuth token
   * @param connection The QBO connection
   * @returns Promise resolving to the refreshed connection or null
   */
  async refreshToken(connection: QBOConnection): Promise<QBOConnection | null> {
    try {
      // In a real app, this would make a request to QBO to refresh the token
      // But we'll mock it here
      console.log('Mocking token refresh for connection:', connection.user_id);
      
      // Return a mock refreshed connection
      return {
        ...connection,
        access_token: 'mock_refreshed_access_token',
        expires_at: new Date(Date.now() + 3600 * 1000).toISOString()
      };
    } catch (error) {
      console.error('Error refreshing QBO token:', error);
      return null;
    }
  }
}
