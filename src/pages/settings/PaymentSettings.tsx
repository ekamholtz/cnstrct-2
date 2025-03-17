import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { 
  getConnectedAccount, 
  createLoginLink, 
  getConnectedAccountFromDB, 
  getStripeAccessToken,
  createConnectedAccount,
  createAccountLink,
  saveConnectedAccount
} from '@/integrations/stripe/services/StripeConnectService';
import { useStripeConnect } from '@/hooks/useStripeConnect';
import { ArrowRight, ExternalLink, CheckCircle, XCircle, Loader2, AlertTriangle, Database, HelpCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { MainNav } from '@/components/navigation/MainNav';
import { PageHeader } from '@/components/shared/PageHeader';

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
  const [isMissingTables, setIsMissingTables] = useState(false);
  const [missingApiKey, setMissingApiKey] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { 
    getAccountStatus, 
    connectStripeAccount, 
    getLoginLink, 
    loading: stripeLoading,
    error: stripeError,
    skipConnectionCheck
  } = useStripeConnect();
  
  useEffect(() => {
    if (stripeError) {
      setError(stripeError);
      
      if (stripeError.includes('table not found') || stripeError.includes('does not exist')) {
        setIsMissingTables(true);
      }
      
      if (stripeError.includes('API key') || stripeError.includes('access token')) {
        setMissingApiKey(true);
      }
    }
  }, [stripeError]);
  
  useEffect(() => {
    const checkConnectedAccount = async () => {
      try {
        if (user === null) return; // Wait for auth to complete
        
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
        
        if (err?.message && (err.message.includes('table not found') || err.message.includes('does not exist'))) {
          setIsMissingTables(true);
          setError('The required database tables are missing. Please run the SQL migrations.');
        } else if (err?.message && (err.message.includes('API key') || err.message.includes('access token'))) {
          setMissingApiKey(true);
          setError('Stripe API key is missing. Please add STRIPE_SECRET_KEY to your .env file.');
        } else {
          setError('Failed to check account status. Please try again.');
        }
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
        window.location.href = accountLink;
      } else {
        throw new Error('Failed to create account link');
      }
    } catch (err: any) {
      console.error('Error connecting to Stripe:', err);
      setError(err.message || 'Failed to connect to Stripe');
      
      if (err.message && (err.message.includes('table not found') || err.message.includes('does not exist'))) {
        setIsMissingTables(true);
      }
      
      if (err.message && (err.message.includes('API key') || err.message.includes('access token'))) {
        setMissingApiKey(true);
      }
      
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
      
      const loginLink = await getLoginLink(accountStatus.accountId);
      
      if (loginLink) {
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
  
  const checkForApiKey = () => {
    getStripeAccessToken().then(token => {
      if (token) {
        setMissingApiKey(false);
        window.location.reload();
      } else {
        toast({
          title: "API Key Still Missing",
          description: "The Stripe API key is still not detected. Please make sure you've added it to your .env file and restarted your server.",
          variant: "destructive"
        });
      }
    });
  };
  
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
  
  const renderDatabaseSetupRequired = () => {
    return (
      <Alert variant="destructive" className="mb-6">
        <Database className="h-4 w-4" />
        <AlertTitle>Database Setup Required</AlertTitle>
        <AlertDescription>
          <p className="mb-2">The required database tables for Stripe Connect are missing. Please run the SQL migrations provided in the documentation.</p>
          <p className="text-sm mb-2">The following tables need to be created:</p>
          <ul className="list-disc list-inside text-sm mb-4">
            <li>stripe_connect_accounts</li>
            <li>payment_links</li>
            <li>payment_records</li>
          </ul>
          <Button 
            variant="outline" 
            size="sm" 
            className="mr-2"
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </Button>
        </AlertDescription>
      </Alert>
    );
  };
  
  const renderApiKeyMissing = () => {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Stripe API Key Missing</AlertTitle>
        <AlertDescription>
          <p className="mb-2">The Stripe secret key is missing from your environment configuration. To enable Stripe functionality, you need to:</p>
          <ol className="list-decimal list-inside text-sm mb-4">
            <li>Create a <code>.env</code> file at the root of your project if it doesn't exist</li>
            <li>Add your Stripe secret key: <code>STRIPE_SECRET_KEY=sk_test_...</code></li>
            <li>Restart your development server</li>
          </ol>
          <p className="text-sm mb-4">You can find your Stripe secret key in the Stripe dashboard under Developers &gt; API keys.</p>
          <div className="flex gap-2">
            <a 
              href="https://dashboard.stripe.com/apikeys" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-blue-500 hover:text-blue-700 mb-2 inline-flex items-center"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Go to Stripe Dashboard
            </a>
            <Button size="sm" variant="outline" onClick={checkForApiKey}>
              I've Added The API Key
            </Button>
          </div>
          <div className="mt-4 text-sm border border-amber-200 bg-amber-50 p-3 rounded">
            <p className="flex items-center text-amber-800">
              <AlertTriangle className="h-3 w-3 mr-2" />
              <strong>Development Mode:</strong> You're seeing this message because you're running in development mode without a Stripe API key.
            </p>
            <p className="mt-1 text-amber-700">
              To proceed without setting up Stripe, you can continue using the application with limited functionality.
            </p>
          </div>
        </AlertDescription>
      </Alert>
    );
  };
  
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
    <>
      <div className="bg-[#172b70] text-white">
        <MainNav />
      </div>
      <div className="container mx-auto py-24 px-4"> {/* Increased top padding to avoid header overlap */}
        <PageHeader 
          title="Payment Settings" 
          description="Manage your payment processing settings and Stripe Connect account"
        />
        
        {isMissingTables && renderDatabaseSetupRequired()}
        {missingApiKey && renderApiKeyMissing()}
        {!isMissingTables && !missingApiKey && error && renderErrorState()}
        
        <Tabs defaultValue="stripe" className="w-full mt-8">
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
                {(loading || stripeLoading) && !initialSetupDone ? (
                  renderLoadingState()
                ) : (skipConnectionCheck || missingApiKey) ? (
                  <div className="space-y-4">
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded">
                      <h3 className="font-medium flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Limited Functionality Mode
                      </h3>
                      <p className="mt-1 text-sm">
                        You're currently running with limited functionality because the Stripe API key is missing.
                        Add your Stripe API key to the .env file to enable full payment functionality.
                      </p>
                    </div>
                    <p>
                      To accept payments from your customers through the platform, you'll need to connect your Stripe account.
                      This requires setting up the Stripe API key first.
                    </p>
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
                          disabled={loading || creatingAccount || isMissingTables || missingApiKey}
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
                {!accountStatus.accountId && !skipConnectionCheck && !missingApiKey && (
                  <Button 
                    onClick={handleConnectStripe} 
                    disabled={loading || creatingAccount || isMissingTables || missingApiKey}
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
                
                {(skipConnectionCheck || missingApiKey) && (
                  <Button 
                    variant="outline" 
                    onClick={checkForApiKey}
                    className="w-full md:w-auto"
                  >
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Check Stripe API Key
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
    </>
  );
};

export default PaymentSettings;
