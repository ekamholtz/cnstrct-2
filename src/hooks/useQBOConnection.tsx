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

export interface QBOConnectionHook {
  connection: QBOConnection | null;
  isLoading: boolean;
  error: Error | null;
  connectToQBO: () => Promise<boolean>;
  disconnectFromQBO: () => Promise<boolean>;
  testConnection: () => Promise<boolean>;
  refreshConnection: () => Promise<void>;
  dataService: QBODataService;
}

export function useQBOConnection(): QBOConnectionHook {
  const [connection, setConnection] = useState<QBOConnection | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const authService = new QBOAuthService();
  const dataService = new QBODataService();
  const { toast } = useToast();
  
  const fetchConnection = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError(new Error("User must be logged in to access QBO connection"));
        setIsLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('qbo_connections')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          setConnection(null);
        } else {
          setError(new Error(error.message));
        }
      } else {
        setConnection(data as QBOConnection);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const connectToQBO = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: 'Error',
          description: "You must be logged in to connect to QuickBooks Online",
          variant: 'destructive'
        });
        setError(new Error("You must be logged in to connect to QuickBooks Online"));
        return false;
      }
      
      const result = await authService.startAuthFlow();
      
      if (!result.success) {
        toast({
          title: 'Connection Failed',
          description: result.error || 'Failed to start QBO authentication flow',
          variant: 'destructive'
        });
        return false;
      }
      
      return true;
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
  
  const testConnection = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: 'Error',
          description: "You must be logged in to test the QBO connection",
          variant: 'destructive'
        });
        return false;
      }
      
      const response = await fetch('/api/qbo-test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: user.id })
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Connection Successful',
          description: `Connected to ${result.companyInfo?.CompanyName || 'QuickBooks Online'}`,
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
  }, [toast]);
  
  const disconnectFromQBO = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await authService.disconnect();
      
      if (result.success) {
        toast({
          title: 'Disconnected',
          description: 'Successfully disconnected from QuickBooks Online',
        });
        
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
    } finally {
      setIsLoading(false);
    }
  }, [authService, fetchConnection, toast]);
  
  useEffect(() => {
    fetchConnection();
  }, [fetchConnection]);
  
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
