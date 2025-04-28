import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainNav } from '@/components/navigation/MainNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, CreditCard, DollarSign, FileText, Settings, Check } from 'lucide-react';
import { useQBOConnection } from '@/hooks/useQBOConnection';
import { useStripeConnect } from '@/hooks/useStripeConnect';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export default function IntegrationSettings() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('stripe');
  
  // QBO integration
  const { 
    connection: qboConnection, 
    isLoading: qboLoading, 
    connectToQBO, 
    disconnectFromQBO 
  } = useQBOConnection();
  
  // Stripe Connect integration
  const { 
    accountStatus, 
    loading: stripeLoading, 
    connectStripeAccount,
    getAccountStatus,
    error: stripeError
  } = useStripeConnect();
  
  const { user } = useAuth();
  const [gcAccountId, setGcAccountId] = useState<string | null>(null);
  
  // Fetch the user's gc_account_id
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.id) {
        const { data, error } = await supabase
          .from('profiles')
          .select('gc_account_id')
          .eq('id', user.id)
          .single();
          
        if (data?.gc_account_id && !error) {
          setGcAccountId(data.gc_account_id);
        }
      }
    };
    
    fetchUserProfile();
  }, [user]);
  
  // Fetch Stripe account status when gcAccountId is available
  useEffect(() => {
    const fetchStripeStatus = async () => {
      if (gcAccountId) {
        await getAccountStatus(gcAccountId);
      }
    };
    
    fetchStripeStatus();
  }, [gcAccountId]);
  
  const handleQBOConnect = () => {
    connectToQBO();
  };
  
  const handleQBODisconnect = async () => {
    const success = await disconnectFromQBO();
    if (success) {
      toast({
        title: 'Success',
        description: 'QuickBooks Online disconnected successfully',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to disconnect from QuickBooks Online',
      });
    }
  };
  
  const handleStripeConnect = async () => {
    if (gcAccountId) {
      const url = await connectStripeAccount(gcAccountId, '/integrations');
      if (url) {
        window.location.href = url;
      }
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in and associated with a company to connect your Stripe account',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNav showSettingsInDropdown={true} />
      
      <main className="container mx-auto px-4 py-8 mt-16">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Integration Settings</h1>
          <p className="text-gray-600 mb-8">
            Configure and manage your external integrations
          </p>
          
          <Tabs defaultValue="stripe" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="stripe">Stripe Connect</TabsTrigger>
              <TabsTrigger value="qbo">QuickBooks Online</TabsTrigger>
            </TabsList>
            
            <TabsContent value="stripe" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="h-5 w-5 mr-2 text-cnstrct-orange" />
                    Stripe Connect Integration
                  </CardTitle>
                  <CardDescription>
                    Connect your Stripe account to process payments and manage subscriptions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {stripeLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-cnstrct-navy" />
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <h3 className="font-medium mb-2">Connection Status</h3>
                        <div className="flex items-center">
                          <div className={`h-3 w-3 rounded-full mr-2 ${accountStatus.accountId ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <span>{accountStatus.accountId ? 'Connected' : 'Not Connected'}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col space-y-4">
                        <Button
                          variant="default"
                          className="bg-cnstrct-navy hover:bg-cnstrct-navy/90 flex items-center"
                          onClick={handleStripeConnect}
                          disabled={stripeLoading}
                        >
                          {stripeLoading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <CreditCard className="h-4 w-4 mr-2" />
                          )}
                          Connect with Stripe
                        </Button>
                        
                        {accountStatus.accountId && (
                          <Button 
                            variant="outline"
                            onClick={() => navigate('/stripe/CreatePaymentLink')}
                          >
                            <DollarSign className="h-4 w-4 mr-2" />
                            Create Payment Link
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="qbo" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-cnstrct-orange" />
                    QuickBooks Online Integration
                  </CardTitle>
                  <CardDescription>
                    Connect to QuickBooks Online to sync invoices, expenses, and payments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {qboLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-cnstrct-navy" />
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <h3 className="font-medium mb-2">Connection Status</h3>
                        <div className="flex items-center">
                          <div className={`h-3 w-3 rounded-full mr-2 ${qboConnection ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <span>{qboConnection ? 'Connected' : 'Not Connected'}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col space-y-4">
                        {!qboConnection ? (
                          <Button 
                            variant="default" 
                            className="bg-cnstrct-navy hover:bg-cnstrct-navy/90"
                            onClick={handleQBOConnect}
                            disabled={qboLoading}
                          >
                            {qboLoading ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Settings className="h-4 w-4 mr-2" />
                            )}
                            Connect to QuickBooks Online
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            onClick={handleQBODisconnect}
                            disabled={qboLoading}
                          >
                            {qboLoading ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4 mr-2" />
                            )}
                            Disconnect from QuickBooks Online
                          </Button>
                        )}
                        
                        {qboConnection && (
                          <Button 
                            variant="outline"
                            onClick={() => navigate('/qbo-test')}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Test QBO Connection
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
