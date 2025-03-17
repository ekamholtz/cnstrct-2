
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useStripeConnect } from '@/hooks/useStripeConnect';
import { ArrowRight, ExternalLink, CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const PaymentSettings = () => {
  const [loading, setLoading] = useState(false);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [accountStatus, setAccountStatus] = useState<{
    accountId?: string;
    chargesEnabled?: boolean;
    payoutsEnabled?: boolean;
    detailsSubmitted?: boolean;
  }>({});
  const [error, setError] = useState<string | null>(null);
  const [initialSetupDone, setInitialSetupDone] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { 
    getAccountStatus, 
    connectStripeAccount, 
    getLoginLink, 
    loading: stripeLoading,
    error: stripeError
  } = useStripeConnect();
  
  useEffect(() => {
    if (stripeError) {
      setError(stripeError);
    }
  }, [stripeError]);
  
  useEffect(() => {
    // Check if the user already has a connected account
    const checkConnectedAccount = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!user || !user.id) {
          navigate('/auth');
          return;
        }
        
        const status = await getAccountStatus(user.id);
        
        if (status) {
          setAccountStatus(status);
        }
        
        setInitialSetupDone(true);
      } catch (err: any) {
        console.error('Error checking connected account:', err);
        setError('Failed to check account status. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      checkConnectedAccount();
    }
  }, [navigate, user, getAccountStatus]);
  
  const handleConnectStripe = async () => {
    try {
      setCreatingAccount(true);
      setError(null);
      
      if (!user || !user.id) {
        navigate('/auth');
        return;
      }
      
      const accountLink = await connectStripeAccount(user.id);
      
      if (accountLink) {
        // Redirect to the Stripe onboarding page
        window.location.href = accountLink;
      } else {
        throw new Error('Failed to create account link');
      }
    } catch (err: any) {
      console.error('Error connecting to Stripe:', err);
      setError(err.message || 'Failed to connect to Stripe');
      
      toast({
        title: 'Error',
        description: err.message || 'Failed to connect to Stripe. Please try again.',
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setCreatingAccount(false);
    }
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
      setError(null);
      
      if (!accountStatus.accountId) {
        setError('No connected account found');
        return;
      }
      
      // Create a login link for the connected account
      const loginLink = await getLoginLink(accountStatus.accountId);
      
      if (loginLink) {
        // Open the login link in a new tab
        window.open(loginLink, '_blank');
      } else {
        throw new Error('Failed to create login link');
      }
    } catch (err: any) {
      console.error('Error creating login link:', err);
      setError(err.message || 'Failed to create login link');
      
      toast({
        title: 'Error',
        description: err.message || 'Failed to create login link. Please try again.',
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Render appropriate loading state
  const renderLoadingState = () => {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto mb-4"></div>
        <p className="text-gray-600 mb-4">Setting up Stripe Connect...</p>
        <Progress value={60} className="max-w-md mx-auto" />
        <p className="mt-4 text-sm text-gray-500">This may take a moment while we prepare your payment integration</p>
      </div>
    );
  };
  
  // Render error state
  const renderErrorState = () => {
    if (!error) return null;
    
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-4 rounded mb-6 flex items-start">
        <AlertTriangle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="font-medium mb-1">Connection Error</h4>
          <p className="text-sm">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.location.reload()} 
            className="mt-2"
          >
            Refresh Page
          </Button>
        </div>
      </div>
    );
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
              {renderErrorState()}
              
              {(loading || stripeLoading) && !initialSetupDone ? (
                renderLoadingState()
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
                        disabled={loading || creatingAccount}
                      >
                        {creatingAccount ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Completing Setup...
                          </>
                        ) : (
                          'Complete Account Setup'
                        )}
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
                  disabled={loading || creatingAccount || !user}
                  className="w-full md:w-auto"
                >
                  {creatingAccount ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    'Connect with Stripe'
                  )}
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
