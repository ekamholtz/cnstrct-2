import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { 
  getConnectedAccountFromDB, 
  createLoginLink, 
  getStripeAccessToken 
} from '@/integrations/stripe/services/StripeConnectService';
import { CheckCircle, XCircle, CreditCard, BarChart3, Settings, ExternalLink } from 'lucide-react';
import CreateCheckoutSessionForm from './CreateCheckoutSessionForm';
import CheckoutSessionHistory from './CheckoutSessionHistory';

export function PaymentSettings() {
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState('dashboard');
  
  const navigate = useNavigate();
  const supabase = useSupabaseClient();
  const { toast } = useToast();
  
  const handleTabChange = (value: string) => {
    setTabValue(value);
  };
  
  useEffect(() => {
    const fetchAccountDetails = async () => {
      try {
        setLoading(true);
        
        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          throw new Error('Failed to get current user');
        }
        
        // Get the connected account from the database
        const connectedAccount = await getConnectedAccountFromDB(user.id);
        setAccount(connectedAccount);
      } catch (err) {
        console.error('Error fetching account details:', err);
        setError('Failed to load payment settings');
        
        toast({
          title: 'Error',
          description: 'Failed to load payment settings. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchAccountDetails();
  }, [supabase, toast]);
  
  const handleConnectStripe = () => {
    navigate('/stripe/onboarding');
  };
  
  const handleGoToDashboard = async () => {
    if (!account?.account_id) return;
    
    try {
      setLoading(true);
      
      const accessToken = await getStripeAccessToken();
      if (!accessToken) {
        throw new Error('Failed to get Stripe access token');
      }
      
      const loginLink = await createLoginLink(account.account_id, accessToken);
      
      // Redirect to Stripe Dashboard
      window.open(loginLink.url, '_blank');
    } catch (err) {
      console.error('Error creating login link:', err);
      
      toast({
        title: 'Error',
        description: 'Failed to create Stripe dashboard login link.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff6b24]"></div>
      </div>
    );
  }
  
  if (!account) {
    return (
      <Card className="max-w-5xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Payment Settings</CardTitle>
          <CardDescription>
            Connect your Stripe account to start accepting payments from your customers
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
            <p className="text-blue-700 text-sm">
              You need to connect your Stripe account before you can accept payments.
            </p>
          </div>
          
          <Button onClick={handleConnectStripe}>
            Connect Stripe Account
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="max-w-5xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Payment Settings</CardTitle>
        <CardDescription>
          Manage your payment settings and view transaction history
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-4">Account Status</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg border p-4 flex items-start space-x-3">
              {account.details_submitted ? (
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
              )}
              <div>
                <p className="font-medium">Account Details</p>
                <p className="text-sm text-gray-500">
                  {account.details_submitted ? 'Submitted' : 'Not Submitted'}
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border p-4 flex items-start space-x-3">
              {account.charges_enabled ? (
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
              )}
              <div>
                <p className="font-medium">Charges</p>
                <p className="text-sm text-gray-500">
                  {account.charges_enabled ? 'Enabled' : 'Not Enabled'}
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border p-4 flex items-start space-x-3">
              {account.payouts_enabled ? (
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
              )}
              <div>
                <p className="font-medium">Payouts</p>
                <p className="text-sm text-gray-500">
                  {account.payouts_enabled ? 'Enabled' : 'Not Enabled'}
                </p>
              </div>
            </div>
          </div>
          
          {(!account.details_submitted || !account.charges_enabled || !account.payouts_enabled) && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-md p-4">
              <p className="text-amber-700 text-sm">
                Your Stripe account setup is incomplete. Please complete the onboarding process to enable all payment features.
              </p>
              <Button
                variant="outline"
                className="mt-2"
                onClick={handleConnectStripe}
              >
                Complete Onboarding
              </Button>
            </div>
          )}
          
          <div className="mt-4">
            <Button
              variant="outline"
              className="flex items-center"
              onClick={handleGoToDashboard}
              disabled={!account.account_id}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Go to Stripe Dashboard
            </Button>
          </div>
        </div>
        
        <Tabs value={tabValue} onValueChange={handleTabChange} aria-label="payment settings tabs">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard">
              <CreditCard className="h-4 w-4 mr-2" />
              Create Payment
            </TabsTrigger>
            <TabsTrigger value="history">
              <BarChart3 className="h-4 w-4 mr-2" />
              Payment History
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="mt-6">
            <CreateCheckoutSessionForm />
          </TabsContent>
          
          <TabsContent value="history" className="mt-6">
            <CheckoutSessionHistory />
          </TabsContent>
          
          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Settings</CardTitle>
                <CardDescription>Configure your payment settings</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  Additional payment settings coming soon.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
