
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { QBOAuthService } from "@/integrations/qbo/authService";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";

export interface QBOConnection {
  id: string;
  company_id: string;
  company_name: string;
  created_at: string;
  updated_at: string;
  access_token: string;
  refresh_token: string;
}

export interface QBOConnectionHook {
  connection: QBOConnection | null;
  isLoading: boolean;
  error: Error | null;
  connectToQBO: () => Promise<boolean>;
  disconnectFromQBO: () => Promise<boolean>;
  testConnection: () => Promise<boolean>;
}

export function useQBOConnection(): QBOConnectionHook {
  const [connection, setConnection] = useState<QBOConnection | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const authService = new QBOAuthService();
  const { user } = useAuth();
  const { toast } = useToast();
  
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
          .select('id, company_id, company_name, created_at, updated_at, access_token, refresh_token')
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
  
  // Listen for messages from the QBO popup window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify message is from our domain
      if (event.origin !== window.location.origin) return;
      
      // Handle success message from QBO popup
      if (event.data?.type === 'QBO_AUTH_SUCCESS') {
        console.log("Received QBO auth success message:", event.data);
        
        // Refresh connection data
        if (user) {
          fetchConnection();
        }
      }
    };
    
    // Function to fetch connection (used after receiving success message)
    async function fetchConnection() {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('qbo_connections')
          .select('id, company_id, company_name, created_at, updated_at, access_token, refresh_token')
          .eq('user_id', user.id)
          .single();
          
        if (!error && data) {
          setConnection(data);
          toast({
            title: "Connection Successful",
            description: `Connected to ${data.company_name || 'QuickBooks Online'}`,
          });
        }
      } catch (err) {
        console.error("Error refreshing QBO connection:", err);
      } finally {
        setIsLoading(false);
      }
    }
    
    // Add message event listener
    window.addEventListener('message', handleMessage);
    
    // Cleanup listener on unmount
    return () => window.removeEventListener('message', handleMessage);
  }, [user, toast]);
  
  const connectToQBO = async (): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to connect to QuickBooks Online",
        variant: "destructive"
      });
      setError(new Error("You must be logged in to connect to QuickBooks Online"));
      return false;
    }
    
    try {
      // Reset any previous errors
      setError(null);
      
      // Use the authService method that launches in a new window
      authService.launchAuthFlow(user.id);
      return true;
    } catch (err) {
      console.error("Error starting QBO auth flow:", err);
      toast({
        title: "Connection Error",
        description: "Failed to start QuickBooks authentication. Please try again.",
        variant: "destructive"
      });
      setError(err instanceof Error ? err : new Error(String(err)));
      return false;
    }
  };
  
  const disconnectFromQBO = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      const success = await authService.disconnect();
      
      if (success) {
        setConnection(null);
        toast({
          title: "Success",
          description: "Disconnected from QuickBooks Online successfully",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to disconnect from QuickBooks Online",
          variant: "destructive"
        });
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
  
  const testConnection = async (): Promise<boolean> => {
    if (!connection) {
      toast({
        title: "Error",
        description: "No QuickBooks connection to test",
        variant: "destructive"
      });
      return false;
    }
    
    try {
      setIsLoading(true);
      
      // Make a test call to QBO API via our Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('qbo-test-connection', {
        method: 'POST',
        body: { connectionId: connection.id }
      });
      
      if (error || !data?.success) {
        toast({
          title: "Connection Test Failed",
          description: error?.message || data?.error || "Could not connect to QuickBooks Online",
          variant: "destructive"
        });
        return false;
      }
      
      toast({
        title: "Connection Successful",
        description: `Successfully connected to ${connection.company_name}`,
      });
      
      return true;
    } catch (err) {
      console.error("Error testing QBO connection:", err);
      toast({
        title: "Connection Test Failed",
        description: err instanceof Error ? err.message : "Failed to test QuickBooks connection",
        variant: "destructive"
      });
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
    disconnectFromQBO,
    testConnection
  };
}
