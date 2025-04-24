
import { useState, useEffect, useCallback } from 'react';
import { QBOAuthService } from '@/integrations/qbo/auth/qboAuthService';
import { QBODataService } from '@/integrations/qbo/services/qboDataService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface QBOConnection {
  id: string;
  user_id: string;
  company_id: string;
  company_name: string;
  created_at: string;
  updated_at: string;
}

export function useQBOConnection() {
  const [isLoading, setIsLoading] = useState(true);
  const [connection, setConnection] = useState<QBOConnection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const authService = new QBOAuthService();
  const dataService = new QBODataService();
  const { toast } = useToast();
  
  // Fetch the current connection
  const fetchConnection = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError("User must be logged in to access QBO connection");
        setIsLoading(false);
        return;
      }
      
      // Get the connection from the database
      const { data, error } = await supabase
        .from('qbo_connections')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          setConnection(null);
        } else {
          setError(error.message);
        }
      } else {
        setConnection(data as QBOConnection);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Connect to QBO
  const connectToQBO = useCallback(async () => {
    try {
      const result = await authService.startAuthFlow();
      
      if (!result.success) {
        toast({
          title: 'Connection Failed',
          description: result.error || 'Failed to start QBO authentication flow',
          variant: 'destructive'
        });
      }
      
      return result.success;
    } catch (err) {
      console.error("Error connecting to QBO:", err);
      toast({
        title: 'Connection Failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive'
      });
      return false;
    }
  }, [authService, toast]);
  
  // Disconnect from QBO
  const disconnectFromQBO = useCallback(async () => {
    try {
      const result = await authService.disconnect();
      
      if (result.success) {
        toast({
          title: 'Disconnected',
          description: 'Successfully disconnected from QuickBooks Online',
        });
        
        // Refresh the connection data
        await fetchConnection();
        
        return true;
      } else {
        toast({
          title: 'Disconnection Failed',
          description: result.error || 'Failed to disconnect from QBO',
          variant: 'destructive'
        });
        return false;
      }
    } catch (err) {
      console.error("Error disconnecting from QBO:", err);
      toast({
        title: 'Disconnection Failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive'
      });
      return false;
    }
  }, [authService, fetchConnection, toast]);
  
  // Test the QBO connection
  const testConnection = useCallback(async () => {
    try {
      const result = await authService.testConnection();
      
      if (result.success) {
        toast({
          title: 'Connection Successful',
          description: `Connected to ${result.companyName || 'QuickBooks Online'}`,
        });
        return true;
      } else {
        toast({
          title: 'Connection Test Failed',
          description: result.error || 'Failed to test QBO connection',
          variant: 'destructive'
        });
        return false;
      }
    } catch (err) {
      console.error("Error testing QBO connection:", err);
      toast({
        title: 'Connection Test Failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive'
      });
      return false;
    }
  }, [authService, toast]);
  
  // Load connection on mount
  useEffect(() => {
    fetchConnection();
  }, [fetchConnection]);
  
  // Listen for auth state changes to refresh connection
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      fetchConnection();
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchConnection]);
  
  return {
    connection,
    isLoading,
    error,
    connectToQBO,
    disconnectFromQBO,
    testConnection,
    refreshConnection: fetchConnection,
    dataService
  };
}
