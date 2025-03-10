
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QBOConnection, getUserQBOConnection, storeQBOConnection } from "@/services/qboService";
import { useToast } from "./use-toast";

export const useQBOConnection = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get the current QBO connection
  const { 
    data: qboConnection,
    isLoading: isLoadingConnection,
    error: connectionError 
  } = useQuery({
    queryKey: ['qbo-connection'],
    queryFn: async () => {
      try {
        const result = await getUserQBOConnection();
        return result;
      } catch (error) {
        console.error("Error fetching QBO connection:", error);
        return null;
      }
    }
  });

  // Connect to QBO
  const connectToQBO = useMutation({
    mutationFn: async (connectionData: {
      company_id: string;
      company_name: string;
      access_token: string;
      refresh_token: string;
      expires_at: Date;
    }) => {
      setIsConnecting(true);
      try {
        return await storeQBOConnection(connectionData);
      } finally {
        setIsConnecting(false);
      }
    },
    onSuccess: () => {
      toast({
        title: "QBO Connected",
        description: "Successfully connected to QuickBooks Online",
      });
      queryClient.invalidateQueries({ queryKey: ['qbo-connection'] });
    },
    onError: (error) => {
      console.error("Error connecting to QBO:", error);
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: "Failed to connect to QuickBooks Online. Please try again.",
      });
    }
  });

  // Check if the token is expired and needs to be refreshed
  const isTokenExpired = (connection: QBOConnection): boolean => {
    if (!connection || !connection.expires_at) return true;
    
    const expiresAt = new Date(connection.expires_at);
    const now = new Date();
    
    // Consider token expired if it's within 5 minutes of expiry
    return (expiresAt.getTime() - now.getTime()) < 5 * 60 * 1000;
  };

  // Determine if we're connected to QBO
  const isConnected = !!qboConnection && !isTokenExpired(qboConnection);

  return {
    qboConnection,
    isConnected,
    isConnecting,
    isLoading: isLoadingConnection,
    connectToQBO: connectToQBO.mutate,
    connectionError
  };
};
