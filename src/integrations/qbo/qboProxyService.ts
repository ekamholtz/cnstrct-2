
import { supabase } from '../supabase/client';
import { QBOConnectionService } from './qboConnectionService';
import { QBOConnection } from './types';

// This service acts as a proxy between the frontend and QBO services
export class QBOProxyService {
  private connectionService: QBOConnectionService;
  
  constructor() {
    this.connectionService = new QBOConnectionService();
  }
  
  /**
   * Gets the QBO connection for the current user
   */
  async getConnection(): Promise<QBOConnection | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }
      
      return await this.connectionService.getConnection(user.id);
    } catch (error) {
      console.error('Error getting QBO connection:', error);
      return null;
    }
  }
  
  /**
   * Checks if the user has a valid QBO connection
   */
  async isConnected(): Promise<boolean> {
    const connection = await this.getConnection();
    return !!connection;
  }
  
  /**
   * Refreshes the QBO token if possible
   */
  async refreshConnection(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }
      
      const connection = await this.connectionService.getConnection(user.id);
      if (!connection || !connection.refresh_token) {
        return false;
      }
      
      const refreshed = await this.connectionService.refreshToken(connection);
      if (refreshed) {
        await this.connectionService.saveConnection(refreshed);
      }
      return !!refreshed;
    } catch (error) {
      console.error('Error refreshing QBO connection:', error);
      return false;
    }
  }
  
  /**
   * Deletes the QBO connection
   */
  async disconnect(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }
      
      await this.connectionService.deleteConnection(user.id);
      return true;
    } catch (error) {
      console.error('Error disconnecting QBO:', error);
      return false;
    }
  }
}

export const qboProxy = new QBOProxyService();
