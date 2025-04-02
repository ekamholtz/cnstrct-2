import { supabase } from '@/integrations/supabase/client';
import { QBOEdgeFunctionService } from '@/lib/qbo/qboEdgeFunctionService';

export interface QBOConnection {
  id: string;
  user_id: string;
  company_id: string;
  company_name: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export class QBOConnectionService {
  private edgeFunctionService: QBOEdgeFunctionService;
  
  constructor() {
    this.edgeFunctionService = new QBOEdgeFunctionService();
  }
  
  /**
   * Gets the QBO connection for the current user
   * @returns QBOConnection object or null if not connected
   */
  async getConnection(): Promise<QBOConnection | null> {
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('No user found, cannot get QBO connection');
        return null;
      }
      
      // Get the connection for this user
      const { data, error } = await supabase
        .from('qbo_connections')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No connection found
          console.log('No QBO connection found for user');
          return null;
        }
        
        console.error('Error fetching QBO connection:', error);
        throw error;
      }
      
      return data as QBOConnection;
    } catch (error) {
      console.error('Error in getConnection:', error);
      return null;
    }
  }

  /**
   * Delete the QBO connection for the current user
   * @returns true if successful, false otherwise
   */
  async deleteConnection(): Promise<boolean> {
    try {
      return await this.edgeFunctionService.disconnect();
    } catch (error) {
      console.error('Error in deleteConnection:', error);
      return false;
    }
  }

  /**
   * Disconnect from QBO - alias for deleteConnection
   * @returns true if successful, false otherwise
   */
  async disconnect(): Promise<boolean> {
    return this.deleteConnection();
  }
}
