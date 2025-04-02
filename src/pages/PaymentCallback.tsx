import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useStripeConnect } from '@/hooks/useStripeConnect';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function PaymentCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing your connection...');
  const [returnUrl, setReturnUrl] = useState('/settings/payments');
  
  const location = useLocation();
  const navigate = useNavigate();
  const { handleOAuthCallback } = useStripeConnect();
  const { user } = useAuth();
  
  useEffect(() => {
    async function processCallback() {
      // Extract query parameters
      const searchParams = new URLSearchParams(location.search);
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      
      if (error) {
        console.error('Error from Stripe:', error);
        setStatus('error');
        setMessage(`Connection failed: ${error}`);
        return;
      }
      
      if (!code || !state) {
        console.error('Missing required parameters');
        setStatus('error');
        setMessage('Invalid callback. Missing required parameters.');
        return;
      }
      
      if (!user?.id) {
        console.error('User not authenticated');
        setStatus('error');
        setMessage('You must be logged in to connect your Stripe account.');
        return;
      }
      
      try {
        const result = await handleOAuthCallback(code, state);
        
        if (!result.success) {
          setStatus('error');
          setMessage(result.error || 'Failed to connect your Stripe account');
          return;
        }
        
        // If we have an onboarding URL, redirect there
        if (result.onboardingUrl) {
          window.location.href = result.onboardingUrl;
          return;
        }
        
        // Otherwise mark as success and use the return URL if provided
        setStatus('success');
        setMessage('Your Stripe account has been connected successfully!');
        
        if (result.returnUrl) {
          setReturnUrl(result.returnUrl);
        }
      } catch (err: any) {
        console.error('Error handling Stripe callback:', err);
        setStatus('error');
        setMessage(err.message || 'An unexpected error occurred');
      }
    }
    
    processCallback();
  }, [location, handleOAuthCallback, user]);
  
  return (
    <DashboardLayout>
      <div className="container mx-auto py-10 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-xl font-bold">
              {status === 'loading' && 'Connecting Your Stripe Account...'}
              {status === 'success' && 'Connection Successful'}
              {status === 'error' && 'Connection Error'}
            </CardTitle>
            <CardDescription>
              {status === 'loading' && 'Please wait while we process your request.'}
              {status === 'success' && 'Your Stripe account has been connected successfully.'}
              {status === 'error' && 'There was a problem connecting your account.'}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="flex flex-col items-center justify-center py-8">
            {status === 'loading' && (
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            )}
            
            {status === 'success' && (
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            )}
            
            {status === 'error' && (
              <XCircle className="h-12 w-12 text-red-500" />
            )}
            
            <p className="mt-4 text-center text-muted-foreground">
              {message}
            </p>
          </CardContent>
          
          <CardFooter className="flex justify-center">
            <Button 
              onClick={() => navigate(returnUrl)}
              disabled={status === 'loading'}
            >
              {status === 'success' ? 'Continue to Settings' : 'Return to Settings'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  );
}
