import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from '../../hooks/useAuth';
import { StripeService } from '../../integrations/services/StripeService';
import { Loader2, Check } from "lucide-react";

interface StripeConnectButtonProps {
  onStatusChange?: (isConnected: boolean) => void;
  buttonText?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  redirectPath?: string;
}

const StripeConnectButton: React.FC<StripeConnectButtonProps> = ({
  onStatusChange,
  buttonText = 'Connect with Stripe',
  variant = 'default',
  size = 'default',
  redirectPath = '/settings'
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  
  // Create an instance of the StripeService
  const stripeService = new StripeService({
    secretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_your_secret_key'
  });
  
  // Check connection status on component mount
  useEffect(() => {
    const checkConnectionStatus = async () => {
      if (!user?.id) return;
      
      try {
        // Use the account info stored in your database or state management
        const accountId = localStorage.getItem(`stripe_account_${user.id}`);
        
        if (accountId) {
          // Verify the account is still valid by trying to fetch it
          const response = await stripeService.getConnectAccount(accountId);
          const isValid = response.success && response.data.payouts_enabled;
          
          setIsConnected(isValid);
          
          if (onStatusChange) {
            onStatusChange(isValid);
          }
        } else {
          setIsConnected(false);
          if (onStatusChange) {
            onStatusChange(false);
          }
        }
      } catch (err) {
        console.error('Error checking Stripe connection status:', err);
        setError('Failed to check connection status');
      }
    };
    
    checkConnectionStatus();
  }, [user?.id, onStatusChange, stripeService]);
  
  const handleConnect = async () => {
    if (!user?.id) {
      setError('You must be logged in to connect your Stripe account');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Create a Stripe Connect account
      const accountResponse = await stripeService.createConnectAccount(
        user.email || 'user@example.com',
        'US',
        'individual'
      );
      
      if (!accountResponse.success) {
        throw new Error(accountResponse.error?.message || 'Failed to create Stripe account');
      }
      
      // Store the account ID for later use
      localStorage.setItem(`stripe_account_${user.id}`, accountResponse.data.id);
      
      // Create an account link for onboarding
      const origin = window.location.origin;
      const linkResponse = await stripeService.createAccountLink(
        accountResponse.data.id,
        `${origin}${redirectPath}?refresh=true`,
        `${origin}${redirectPath}?success=true`
      );
      
      if (!linkResponse.success) {
        throw new Error(linkResponse.error?.message || 'Failed to create onboarding link');
      }
      
      // Redirect to the Stripe onboarding page
      window.location.href = linkResponse.data.url;
    } catch (err: any) {
      console.error('Error initiating Stripe Connect auth:', err);
      setError(err.message || 'Failed to start Stripe Connect process');
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Button
        variant={isConnected ? "outline" : variant}
        onClick={handleConnect}
        disabled={loading || (isConnected === true)}
        size={size}
        className={`flex items-center gap-2 ${isConnected ? 'bg-slate-100 hover:bg-slate-200 text-slate-900' : ''}`}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <img 
              src="https://stripe.com/img/v3/home/social.png" 
              alt="Stripe Logo" 
              className="h-5 w-auto" 
            />
            {isConnected ? (
              <>
                <Check className="h-4 w-4" />
                <span>Connected with Stripe</span>
              </>
            ) : (
              <span>{buttonText}</span>
            )}
          </>
        )}
      </Button>
      
      {isConnected && (
        <Card className="bg-slate-50">
          <CardContent className="pt-4 text-sm text-muted-foreground">
            Your Stripe account is connected and ready to receive payments
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StripeConnectButton;
