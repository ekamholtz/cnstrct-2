import React, { useState } from 'react';
import { Button, Box, Typography, Alert, CircularProgress } from '@mui/material';
import { useAuth } from '../../hooks/useAuth';
import StripeAuthorizationService from '../../integrations/stripe/auth/StripeAuthorizationService';
import StripeTokenManager from '../../integrations/stripe/auth/stripeTokenManager';

interface StripeConnectButtonProps {
  onStatusChange?: (isConnected: boolean) => void;
  buttonText?: string;
  variant?: 'contained' | 'outlined' | 'text';
  size?: 'small' | 'medium' | 'large';
  redirectPath?: string;
}

const StripeConnectButton: React.FC<StripeConnectButtonProps> = ({
  onStatusChange,
  buttonText = 'Connect with Stripe',
  variant = 'contained',
  size = 'medium',
  redirectPath = '/settings'
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  
  const authService = new StripeAuthorizationService();
  const tokenManager = new StripeTokenManager();
  
  // Check connection status on component mount
  React.useEffect(() => {
    const checkConnectionStatus = async () => {
      if (!user?.id) return;
      
      try {
        const isValid = await tokenManager.hasValidConnectAccount(user.id);
        setIsConnected(isValid);
        
        if (onStatusChange) {
          onStatusChange(isValid);
        }
      } catch (err) {
        console.error('Error checking Stripe connection status:', err);
        setError('Failed to check connection status');
      }
    };
    
    checkConnectionStatus();
  }, [user?.id]);
  
  const handleConnect = () => {
    if (!user?.id) {
      setError('You must be logged in to connect your Stripe account');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Initiate the Stripe Connect OAuth flow
      authService.initiateAuth(user.id, redirectPath);
    } catch (err: any) {
      console.error('Error initiating Stripe Connect auth:', err);
      setError(err.message || 'Failed to start Stripe Connect process');
      setLoading(false);
    }
  };
  
  const buttonStyle = {
    backgroundColor: isConnected ? '#EFEFEF' : '#6772e5',
    color: isConnected ? '#333333' : '#ffffff',
    '&:hover': {
      backgroundColor: isConnected ? '#DDDDDD' : '#5469d4',
    }
  };
  
  return (
    <Box sx={{ mb: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Button
        variant={variant}
        onClick={handleConnect}
        disabled={loading || (isConnected === true)}
        size={size}
        sx={{
          ...buttonStyle,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        {loading ? (
          <CircularProgress size={24} color="inherit" />
        ) : (
          <>
            <img 
              src="https://stripe.com/img/v3/home/social.png" 
              alt="Stripe Logo" 
              style={{ height: '20px', marginRight: '8px' }} 
            />
            {isConnected ? 'Connected with Stripe' : buttonText}
          </>
        )}
      </Button>
      
      {isConnected && (
        <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
          Your Stripe account is connected and ready to receive payments
        </Typography>
      )}
    </Box>
  );
};

export default StripeConnectButton;
