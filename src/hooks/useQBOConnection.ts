
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { QBOAuthService } from '../integrations/qbo/authService';

export interface QBOConnection {
  id: string;
  user_id: string;
  company_id: string;
  company_name: string;
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  created_at: string;
  updated_at: string;
}

export interface QBOConnectionHook {
  connection: QBOConnection | null;
  isLoading: boolean;
  error: Error | null;
  connectToQBO: () => Promise<boolean>;
  disconnectFromQBO: () => Promise<boolean>;
  testConnection: () => Promise<boolean>;
}

export const useQBOConnection = (): QBOConnectionHook => {
  const [connection, setConnection] = useState<QBOConnection | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();
  const authService = new QBOAuthService();

  // Fetch connection on mount and when user changes
  useEffect(() => {
    if (!user) {
      setConnection(null);
      setIsLoading(false);
      return;
    }

    fetchConnection();
  }, [user]);

  const fetchConnection = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('qbo_connections')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // No connection found, not an error
          setConnection(null);
        } else {
          console.error('Error fetching QBO connection:', fetchError);
          setError(new Error(`Error fetching QBO connection: ${fetchError.message}`));
        }
      } else {
        setConnection(data);
      }
    } catch (err: any) {
      console.error('Unexpected error in useQBOConnection:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const connectToQBO = async (): Promise<boolean> => {
    try {
      if (!user) {
        setError(new Error('User must be logged in to connect to QBO'));
        return false;
      }

      await authService.launchAuthFlow(user.id);
      return true;
    } catch (err: any) {
      console.error('Error launching QBO auth flow:', err);
      setError(err);
      return false;
    }
  };

  const disconnectFromQBO = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      if (!connection) {
        return true; // Already disconnected
      }
      
      const { error: deleteError } = await supabase
        .from('qbo_connections')
        .delete()
        .eq('id', connection.id);
      
      if (deleteError) {
        throw deleteError;
      }
      
      setConnection(null);
      return true;
    } catch (err: any) {
      console.error('Error disconnecting from QBO:', err);
      setError(err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async (): Promise<boolean> => {
    try {
      if (!connection) {
        setError(new Error('No active QBO connection to test'));
        return false;
      }

      // Call the test connection endpoint
      const { data, error } = await supabase
        .functions.invoke('qbo-test-connection', {
          body: { connectionId: connection.id }
        });

      if (error) {
        throw new Error(`Connection test failed: ${error.message}`);
      }

      return data?.success || false;
    } catch (err: any) {
      console.error('Error testing QBO connection:', err);
      setError(err);
      return false;
    }
  };

  return {
    connection,
    isLoading,
    error,
    connectToQBO,
    disconnectFromQBO,
    testConnection
  };
};
