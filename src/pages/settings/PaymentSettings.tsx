import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { getConnectedAccount, createLoginLink } from '@/integrations/stripe/services/StripeConnectService';
import { ArrowRight, ExternalLink, CheckCircle, XCircle } from 'lucide-react';

const PaymentSettings = () => {
  const [loading, setLoading] = useState(false);
  const [accountStatus, setAccountStatus] = useState<{
    accountId?: string;
    chargesEnabled?: boolean;
    payoutsEnabled?: boolean;
    detailsSubmitted?: boolean;
  }>({});
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const supabase = useSupabaseClient();
  
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
        }
      } catch (err) {
        console.error('Error checking connected account:', err);
        setError('Failed to check account status');
      } finally {
        setLoading(false);
      }
    };
    
    checkConnectedAccount();
  }, [navigate, supabase]);
  
  const handleConnectStripe = () => {
    navigate('/stripe/onboarding');
  };
  
  const handleCreatePaymentLink = () => {
    navigate('/stripe/create-payment');
  };
  
  const handleViewPaymentHistory = () => {
    navigate('/stripe/payment-history');
  };
  
  const handleManageAccount = async () => {
    try {
      setLoading(true);
      
      if (!accountStatus.accountId) {
        setError('No connected account found');
        return;
      }
      
      // Get the access token from secure storage
      // This is a placeholder - you'll need to implement secure token storage
      const accessToken = 'YOUR_STRIPE_ACCESS_TOKEN';
      
      // Create a login link for the connected account
      const loginLink = await createLoginLink(accountStatus.accountId, accessToken);
      
      // Open the login link in a new tab
      window.open(loginLink.url, '_blank');
    } catch (err) {
      console.error('Error creating login link:', err);
      setError('Failed to create login link');
      
      toast({
        title: 'Error',
        description: 'Failed to create login link. Please try again.',
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Payment Settings</h1>
      
      <Tabs defaultValue="stripe" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="stripe">Stripe Connect</TabsTrigger>
          <TabsTrigger value="settings">Payment Preferences</TabsTrigger>
        </TabsList>
        
        <TabsContent value="stripe">
          <Card>
            <CardHeader>
              <CardTitle>Stripe Connect</CardTitle>
              <CardDescription>
                Connect your Stripe account to receive payments from your customers
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}
              
              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading account information...</p>
                </div>
              ) : accountStatus.accountId ? (
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
                        Complete Account Setup
                      </Button>
                    </div>
                  )}
                  
                  {accountStatus.detailsSubmitted && accountStatus.chargesEnabled && accountStatus.payoutsEnabled && (
                    <div className="mt-4 space-y-4">
                      <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                        Your Stripe account is fully set up and ready to accept payments!
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Create Payment Link</CardTitle>
                            <CardDescription>
                              Generate a payment link to send to your customers
                            </CardDescription>
                          </CardHeader>
                          <CardFooter>
                            <Button onClick={handleCreatePaymentLink} className="w-full">
                              Create Payment Link
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </CardFooter>
                        </Card>
                        
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Payment History</CardTitle>
                            <CardDescription>
                              View your payment history and transaction details
                            </CardDescription>
                          </CardHeader>
                          <CardFooter>
                            <Button onClick={handleViewPaymentHistory} className="w-full">
                              View History
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </CardFooter>
                        </Card>
                      </div>
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
            
            <CardFooter className="flex justify-between">
              {!accountStatus.accountId && (
                <Button 
                  onClick={handleConnectStripe} 
                  disabled={loading}
                >
                  Connect with Stripe
                </Button>
              )}
              
              {accountStatus.accountId && (
                <Button 
                  variant="outline" 
                  onClick={handleManageAccount}
                  disabled={loading}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Manage Stripe Account
                </Button>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Payment Preferences</CardTitle>
              <CardDescription>
                Configure your payment preferences and settings
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <p className="text-gray-600">
                Payment preferences will be available once you've connected your Stripe account.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PaymentSettings;
