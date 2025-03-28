
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Box } from '@/components/ui/box';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2, AlertTriangle, Database, ExternalLink, HelpCircle } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import StripeConnectButton from './StripeConnectButton';
import StripeTokenManager from '../../integrations/stripe/auth/stripeTokenManager';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface PaymentRecord {
  id: string;
  invoice_id: string;
  payment_intent_id: string;
  amount: number;
  status: string;
  payment_method: string;
  error_message?: string;
  created_at: string;
}

interface StripeAccount {
  id: string;
  user_id: string;
  account_id: string;
  account_name: string;
  account_email: string;
  default_account: boolean;
  account_status: string;
  created_at: string;
  updated_at: string;
}

const PaymentSettings: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stripeConnected, setStripeConnected] = useState(false);
  const [accountInfo, setAccountInfo] = useState<StripeAccount | null>(null);
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  
  const tokenManager = new StripeTokenManager();
  
  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Check if user has a valid Stripe Connect account
        const isConnected = await tokenManager.hasValidConnectAccount(user.id);
        setStripeConnected(isConnected);
        
        // If connected, fetch account details
        if (isConnected) {
          // Fetch account info
          const { data: accountData, error: accountError } = await supabase
            .from('stripe_connect_accounts')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          
          if (accountError) {
            throw accountError;
          }
          
          setAccountInfo(accountData as StripeAccount);
          
          // Fetch payment records
          const { data: recordsData, error: recordsError } = await supabase
            .from('payment_records')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
          
          if (recordsError) {
            throw recordsError;
          }
          
          setPaymentRecords(recordsData as PaymentRecord[]);
        }
      } catch (err: any) {
        console.error('Error loading payment settings data:', err);
        setError(err.message || 'Failed to load payment settings');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [user?.id, stripeConnected]);
  
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleConnectionStatusChange = (isConnected: boolean) => {
    setStripeConnected(isConnected);
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  if (!user) {
    return (
      <Alert variant="warning">
        <AlertTitle>Authentication Required</AlertTitle>
        <AlertDescription>
          You must be logged in to access payment settings.
        </AlertDescription>
      </Alert>
    );
  }
  
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800"></div>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Payment Settings</h2>
      
      <Separator className="mb-6" />
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="w-full">
        <Tabs defaultValue="connect" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="connect">Stripe Connect</TabsTrigger>
            <TabsTrigger value="history" disabled={!stripeConnected}>Payment History</TabsTrigger>
            <TabsTrigger value="settings" disabled={!stripeConnected}>Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="connect">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Connect Your Stripe Account</CardTitle>
                <CardDescription>
                  Connect your Stripe account to start accepting payments for your invoices.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4">
                  <StripeConnectButton 
                    onStatusChange={handleConnectionStatusChange}
                    redirectPath="/settings/payments"
                  />
                </div>
              </CardContent>
            </Card>
            
            {stripeConnected && accountInfo && (
              <Card>
                <CardHeader>
                  <CardTitle>Connected Account</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Account Name</p>
                      <p className="text-sm">{accountInfo.account_name}</p>
                      
                      <p className="text-sm font-medium mt-3">Email</p>
                      <p className="text-sm">{accountInfo.account_email}</p>
                      
                      <p className="text-sm font-medium mt-3">Status</p>
                      <p className="text-sm">{accountInfo.account_status}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium">Account ID</p>
                      <p className="text-sm">{accountInfo.account_id}</p>
                      
                      <p className="text-sm font-medium mt-3">Connected</p>
                      <p className="text-sm">{formatDate(accountInfo.created_at)}</p>
                      
                      <p className="text-sm font-medium mt-3">Default Account</p>
                      <p className="text-sm">{accountInfo.default_account ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex gap-3">
                    <Button 
                      variant="default" 
                      onClick={() => window.open('https://dashboard.stripe.com', '_blank')}
                      className="flex items-center"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Stripe Dashboard
                    </Button>
                    
                    <Button 
                      variant="destructive" 
                      onClick={() => {
                        // Implement disconnect functionality here
                        alert('This would disconnect your Stripe account. Functionality not yet implemented.');
                      }}
                    >
                      Disconnect Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>View your payment transaction history</CardDescription>
              </CardHeader>
              <CardContent>
                {paymentRecords.length === 0 ? (
                  <Alert variant="warning" className="bg-amber-50">
                    <AlertTitle>No Payments Found</AlertTitle>
                    <AlertDescription>
                      No payment records found. When you start receiving payments, they will appear here.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Invoice</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Payment Method</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paymentRecords.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>{formatDate(record.created_at)}</TableCell>
                            <TableCell>{record.invoice_id}</TableCell>
                            <TableCell>{formatCurrency(record.amount)}</TableCell>
                            <TableCell>
                              {record.payment_method.charAt(0).toUpperCase() + record.payment_method.slice(1)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                record.status === 'succeeded' ? 'success' : 
                                record.status === 'failed' ? 'destructive' : 
                                'warning'
                              }>
                                {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Payment Settings</CardTitle>
                <CardDescription>Configure payment preferences and options</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Platform Fee</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm mb-2">
                        The platform fee is automatically calculated and applied to all payments.
                      </p>
                      <p className="text-lg font-bold">
                        {import.meta.env.VITE_STRIPE_PLATFORM_FEE_PERCENTAGE || '2.5'}%
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Payment Methods</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm mb-2">
                        The following payment methods are enabled for your account:
                      </p>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          Credit and Debit Cards
                        </p>
                        <p className="text-sm flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          ACH Direct Debit (US only)
                        </p>
                        <p className="text-sm flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          Bank Transfers
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Alert variant="warning" className="mt-6">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Additional Settings</AlertTitle>
                  <AlertDescription>
                    Additional payment settings are managed directly through your Stripe Dashboard.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PaymentSettings;
