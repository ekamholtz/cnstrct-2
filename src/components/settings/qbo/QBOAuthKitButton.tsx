
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuthKit } from '@picahq/authkit';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

// Define the interface to properly map AuthKit's ConnectionRecord to our expected structure
interface ConnectionRecord {
  id: string;
  name?: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  [key: string]: any; // To allow for additional properties that may be present
}

// Define the connection type to match the AuthKit's ConnectionRecord type
interface QBOConnectionData {
  id: string;
  name?: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface QBOAuthKitButtonProps {
  onSuccess?: (connection: any) => void;
  variant?: 'default' | 'outline' | 'secondary' | 'destructive';
  size?: 'sm' | 'default' | 'lg';
}

export function QBOAuthKitButton({
  onSuccess,
  variant = 'default',
  size = 'default'
}: QBOAuthKitButtonProps) {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const { open } = useAuthKit({
    token: {
      url: `https://wkspjzbybjhvscqdmpwi.supabase.co/functions/v1/authkit-token`,
      headers: {
        Authorization: `Bearer ${session?.access_token || ''}`
      },
    },
    onSuccess: (connection: ConnectionRecord) => {
      // For type compatibility, we're extracting the properties we need
      setIsLoading(true);
      console.log('QBO connection successful:', connection);
      
      // Cast the connection to our interface to match property names
      const qboConnection: QBOConnectionData = {
        id: connection.id,
        name: connection.name,
        accessToken: connection.accessToken,
        refreshToken: connection.refreshToken,
        expiresIn: connection.expiresIn
      };
      
      // Now use our properly typed object for the database operations
      handleConnectionSuccess(qboConnection)
        .catch(error => {
          console.error('Error in connection handling:', error);
          toast({
            title: 'Error',
            description: `Failed to process QBO connection: ${error.message || 'Unknown error'}`,
            variant: 'destructive',
          });
        })
        .finally(() => {
          setIsLoading(false);
        });
    },
    onError: (error: any) => {
      console.error('QBO connection error:', error);
      toast({
        title: 'Connection Error',
        description: error.message || 'Failed to connect to QuickBooks Online',
        variant: 'destructive',
      });
    },
    onClose: () => {
      console.log('AuthKit modal closed');
    },
  });

  const handleConnectionSuccess = async (connection: QBOConnectionData) => {
    try {
      // Store connection in Supabase
      const { error } = await supabase.from('qbo_connections').upsert({
        user_id: user?.id,
        company_id: connection.id,
        company_name: connection.name || 'QuickBooks Company',
        access_token: connection.accessToken,
        refresh_token: connection.refreshToken,
        expires_at: new Date(Date.now() + connection.expiresIn * 1000).toISOString(),
      });
      
      if (error) throw error;
      
      // Show success message
      toast({
        title: 'Connection Successful',
        description: `Connected to ${connection.name || 'QuickBooks Online'}`,
      });
      
      // Call the onSuccess callback
      if (onSuccess) onSuccess(connection);
    } catch (error: any) {
      console.error('Error storing QBO connection:', error);
      throw error; // Re-throw to be caught by the caller
    }
  };

  const handleConnect = () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'You must be logged in to connect to QuickBooks Online',
        variant: 'destructive',
      });
      return;
    }
    
    open();
  };

  return (
    <Button 
      variant={variant} 
      size={size} 
      onClick={handleConnect}
      disabled={isLoading || !user}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Connect with QuickBooks
    </Button>
  );
}
