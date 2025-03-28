
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { QBOAuthService } from "@/integrations/qbo/authService";
import { useAuth } from "@/hooks/useAuth";

export interface QBOConnection {
  id: string;
  company_id: string;
  company_name: string;
  access_token: string;
  refresh_token: string;
  created_at: string;
  updated_at: string;
}

interface QBOConnectionHook {
  connection: QBOConnection | null;
  isLoading: boolean;
  error: Error | null;
  connectToQBO: () => void;
  disconnectFromQBO: () => Promise<boolean>;
}

export function useQBOConnection(): QBOConnectionHook {
  const [connection, setConnection] = useState<QBOConnection | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const authService = new QBOAuthService();
  const { user } = useAuth();
  
  useEffect(() => {
    async function fetchConnection() {
      try {
        setIsLoading(true);
        
        // Check if user is authenticated
        if (!user) {
          setConnection(null);
          setIsLoading(false);
          return;
        }
        
        // Query for existing connection
        const { data, error } = await supabase
          .from('qbo_connections')
          .select('id, company_id, company_name, access_token, refresh_token, created_at, updated_at')
          .eq('user_id', user.id)
          .single();
          
        if (error) {
          if (error.code === 'PGRST116') {
            // No connection found, not an error
            setConnection(null);
          } else {
            console.error("Error fetching QBO connection:", error);
            setError(new Error(`Failed to fetch QBO connection: ${error.message}`));
          }
        } else {
          setConnection(data);
        }
      } catch (err) {
        console.error("Error in useQBOConnection:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchConnection();
  }, [user]);
  
  const connectToQBO = () => {
    if (!user) {
      setError(new Error("You must be logged in to connect to QuickBooks Online"));
      return;
    }
    
    const authUrl = authService.getAuthorizationUrl(user.id);
    window.location.href = authUrl;
  };
  
  const disconnectFromQBO = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      const success = await authService.disconnect();
      
      if (success) {
        setConnection(null);
      }
      
      return success;
    } catch (err) {
      console.error("Error disconnecting from QBO:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    connection,
    isLoading,
    error,
    connectToQBO,
    disconnectFromQBO
  };
}
