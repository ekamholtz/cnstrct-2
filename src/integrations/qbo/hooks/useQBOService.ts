import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
// Import the services using the correct casing to match the actual file names
import { BaseQBOService } from "../services/BaseQBOService";
import { AccountService } from "../services/AccountService";
import { entityReferenceService } from "../services/entityReferenceService"; 
import { billService } from "../services/billService";
import { CustomerVendorService } from "../services/CustomerVendorService";
import { invoiceService } from "../services/invoiceService";

interface QBOAuthResponse {
  realmId: string | null;
  error: string | null;
  authUrl: string | null;
}

export const useQBOService = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [realmId, setRealmId] = useState<string | null>(null);
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Load realmId from localStorage on component mount
    const storedRealmId = localStorage.getItem('qbo_realm_id');
    if (storedRealmId) {
      setRealmId(storedRealmId);
    }
  }, []);

  const qboAuthMutation = useMutation<QBOAuthResponse, Error>({
    mutationFn: async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/qbo-auth`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to initiate QBO authentication');
        }

        return await response.json();
      } catch (error: any) {
        console.error("QBO Auth Error:", error.message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: (data) => {
      if (data.error) {
        toast({
          variant: "destructive",
          title: "QBO Authentication Error",
          description: data.error,
        });
      } else if (data.authUrl && data.realmId) {
        setAuthUrl(data.authUrl);
        setRealmId(data.realmId);
        localStorage.setItem('qbo_realm_id', data.realmId);
        window.location.href = data.authUrl;
      } else {
        toast({
          variant: "destructive",
          title: "QBO Authentication Issue",
          description: "Could not retrieve authentication URL.",
        });
      }
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "QBO Authentication Error",
        description: error.message || "Failed to initiate QBO authentication.",
      });
    },
  });

  const connectQBO = async () => {
    await qboAuthMutation.mutateAsync();
  };

  const disconnectQBO = async () => {
    setIsLoading(true);
    try {
      // Clear the realmId from localStorage
      localStorage.removeItem('qbo_realm_id');
      setRealmId(null);

      // Optionally, call a Supabase function to revoke tokens if needed
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/qbo-disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to disconnect from QBO');
      }

      toast({
        title: "QBO Disconnected",
        description: "Successfully disconnected from QuickBooks Online.",
      });
    } catch (error: any) {
      console.error("QBO Disconnect Error:", error.message);
      toast({
        variant: "destructive",
        title: "QBO Disconnect Error",
        description: error.message || "Failed to disconnect from QuickBooks Online.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    realmId,
    authUrl,
    connectQBO,
    disconnectQBO,
  };
};
