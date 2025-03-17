import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createConnectedAccount, createAccountLink, getConnectedAccount } from '@/integrations/stripe/services/StripeConnectService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

const StripeConnectOnboarding = () => {
  const [loading, setLoading] = useState(false);
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
  const supabase = useSupabaseClient();
  
  // Parse query parameters
  const queryParams = new URLSearchParams(location.search);
  const success = queryParams.get('success') === 'true';
  const refresh = queryParams.get('refresh') === 'true';

  useEffect(() => {
    // Check if the user already has a connected account
    const checkConnectedAccount = async () => {
      try {
        setLoading(true);
        
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login');
          return;
        }
        
        // Check if the user has a connected account in the database
        const { data: accountData, error: accountError } = await supabase
          .from('stripe_connect_accounts')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (accountError && accountError.code !== 'PGRST116') {
          console.error('Error fetching Stripe account:', accountError);
          setError('Failed to fetch account information');
          return;
        }
        
        if (accountData) {
          // Get the access token from secure storage
          // This is a placeholder - you'll need to implement secure token storage
          const accessToken = 'YOUR_STRIPE_ACCESS_TOKEN';
          
          // Get the account details from Stripe
          const accountDetails = await getConnectedAccount(accountData.account_id, accessToken);
          
          setAccountStatus({
            accountId: accountData.account_id,
            chargesEnabled: accountDetails.charges_enabled,
            payoutsEnabled: accountDetails.payouts_enabled,
            detailsSubmitted: accountDetails.details_submitted
          });
          
          // If the user just completed onboarding successfully
          if (success && !refresh) {
            toast({
              title: 'Account Connected',
              description: 'Your Stripe account has been successfully connected!',
              duration: 5000,
            });
          }
        }
      } catch (err) {
        console.error('Error checking connected account:', err);
        setError('Failed to check account status');
      } finally {
        setLoading(false);
      }
    };
    
    checkConnectedAccount();
  }, [navigate, supabase, success, refresh, toast]);
  
  const handleConnectStripe = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      
      // Get the access token from secure storage
      // This is a placeholder - you'll need to implement secure token storage
      const accessToken = 'YOUR_STRIPE_ACCESS_TOKEN';
      
      // Create a Stripe Connect account
      const account = await createConnectedAccount(user.id, accessToken);
      
      // Store the account ID in the database
      const { error: insertError } = await supabase
        .from('stripe_connect_accounts')
        .insert({
          user_id: user.id,
          account_id: account.id,
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
          details_submitted: account.details_submitted
        });
      
      if (insertError) {
        console.error('Error storing Stripe account:', insertError);
        setError('Failed to store account information');
        return;
      }
      
      // Create an account link for onboarding
      const refreshUrl = `${window.location.origin}/settings/payments?refresh=true`;
      const returnUrl = `${window.location.origin}/settings/payments?success=true`;
      
      const accountLink = await createAccountLink(account.id, accessToken, refreshUrl, returnUrl);
      
      // Redirect to Stripe's hosted onboarding
      window.location.href = accountLink.url;
    } catch (err: any) {
      console.error('Error connecting Stripe account:', err);
      setError(err.message || 'Failed to connect with Stripe');
      
      toast({
        title: 'Connection Failed',
        description: 'There was a problem connecting your Stripe account. Please try again.',
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setLoading(false);
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
