import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { handleStripeConnectCallback } from '@/integrations/stripe/services/StripeConnectService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

const StripeConnectCallback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Parse the query parameters from the URL
        const params = new URLSearchParams(location.search);
        const code = params.get('code');
        const state = params.get('state');
        const errorParam = params.get('error');
        const errorDescription = params.get('error_description');
        
        // If there's an error parameter, display it
        if (errorParam) {
          setError(errorDescription || 'An error occurred during the Stripe Connect process');
          setLoading(false);
          return;
        }
        
        // Check if we have the required parameters
        if (!code || !state) {
          setError('Missing required parameters from Stripe callback');
          setLoading(false);
          return;
        }
        
        // Process the callback
        await handleStripeConnectCallback(code, state);
        
        // Mark as successful
        setSuccess(true);
        setLoading(false);
        
        // Redirect back to payment settings after a short delay
        setTimeout(() => {
          navigate('/settings/payments?connectSuccess=true');
        }, 2000);
      } catch (error) {
        console.error('Error handling Stripe callback:', error);
        setError(error instanceof Error ? error.message : 'An error occurred processing the Stripe callback');
        setLoading(false);
      }
    };
    
    handleCallback();
  }, [location, navigate]);

  return (
    <DashboardLayout>
      <div className="w-full max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Stripe Connect</h1>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{loading ? 'Processing' : success ? 'Success!' : 'Error'}</CardTitle>
            <CardDescription>
              {loading ? 'Completing your Stripe Connect setup...' : 
               success ? 'Your Stripe account has been successfully connected' :
               'There was a problem connecting your Stripe account'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Processing, please wait...</span>
              </div>
            ) : success ? (
              <div className="py-4 text-green-600">
                Your Stripe account has been successfully connected. Redirecting to payment settings...
              </div>
            ) : (
              <div className="py-4 text-red-600">
                {error || 'An unknown error occurred. Please try again.'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default StripeConnectCallback;
