import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useStripeConnect } from '@/hooks/useStripeConnect';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

const StripeConnectOnboarding = () => {
  const [accountStatus, setAccountStatus] = useState<{
    accountId?: string;
    chargesEnabled?: boolean;
    payoutsEnabled?: boolean;
    detailsSubmitted?: boolean;
  }>({});
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { 
    loading, 
    getAccountStatus, 
    connectStripeAccount 
  } = useStripeConnect();
  
  const queryParams = new URLSearchParams(location.search);
  const success = queryParams.get('success') === 'true';
  const refresh = queryParams.get('refresh') === 'true';

  useEffect(() => {
    const checkConnectedAccount = async () => {
      try {
        if (!user) {
          navigate('/login');
          return;
        }
        
        const status = await getAccountStatus(user.id);
        if (status) {
          setAccountStatus(status);
          
          if (success && !refresh) {
            toast({
              title: 'Account Connected',
              description: 'Your Stripe account has been successfully connected!',
              duration: 5000,
            });
          }
        }
      } catch (err: any) {
        console.error('Error checking connected account:', err);
        setError('Failed to check account status');
      }
    };
    
    checkConnectedAccount();
  }, [navigate, user, success, refresh, toast, getAccountStatus]);
  
  const handleConnectStripe = async () => {
    try {
      setError(null);
      
      if (!user) {
        navigate('/login');
        return;
      }
      
      const accountLinkUrl = await connectStripeAccount(user.id);
      
      if (accountLinkUrl) {
        window.location.href = accountLinkUrl;
      } else {
        throw new Error('Failed to create account link');
      }
    } catch (err: any) {
      console.error('Error connecting Stripe account:', err);
      setError(err.message || 'Failed to connect with Stripe');
      
      toast({
        title: 'Connection Failed',
        description: 'There was a problem connecting your Stripe account. Please try again.',
        variant: 'destructive',
        duration: 5000,
      });
    }
  };
  
  const handleGoBack = () => {
    navigate(-1);
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <Button variant="ghost" className="mb-4" onClick={handleGoBack}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Connect with Stripe</CardTitle>
          <CardDescription>
            Connect your Stripe account to start accepting payments from your customers
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {accountStatus.accountId ? (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Account Status</h3>
              
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center">
                  {accountStatus.detailsSubmitted ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500 mr-2" />
                  )}
                  <span>Account details submitted</span>
                </div>
                
                <div className="flex items-center">
                  {accountStatus.chargesEnabled ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500 mr-2" />
                  )}
                  <span>Charges enabled</span>
                </div>
                
                <div className="flex items-center">
                  {accountStatus.payoutsEnabled ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500 mr-2" />
                  )}
                  <span>Payouts enabled</span>
                </div>
              </div>
              
              {(!accountStatus.detailsSubmitted || !accountStatus.chargesEnabled || !accountStatus.payoutsEnabled) && (
                <div className="mt-4">
                  <p className="text-amber-600 mb-2">
                    Your account setup is incomplete. Please complete the onboarding process to start accepting payments.
                  </p>
                  <Button 
                    onClick={handleConnectStripe} 
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : 'Complete Account Setup'}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p>
                To accept payments from your customers through CNSTRCT Network, you'll need to connect your Stripe account.
                This allows you to receive payments directly to your bank account.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
                <h4 className="font-medium">What you'll need:</h4>
                <ul className="list-disc list-inside mt-2">
                  <li>Your business information</li>
                  <li>Your bank account details</li>
                  <li>A government-issued ID</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter>
          {!accountStatus.accountId && (
            <Button 
              onClick={handleConnectStripe} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Connecting...' : 'Connect with Stripe'}
            </Button>
          )}
          
          {accountStatus.accountId && accountStatus.detailsSubmitted && accountStatus.chargesEnabled && accountStatus.payoutsEnabled && (
            <div className="w-full text-center text-green-600">
              Your Stripe account is fully set up and ready to accept payments!
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default StripeConnectOnboarding;
