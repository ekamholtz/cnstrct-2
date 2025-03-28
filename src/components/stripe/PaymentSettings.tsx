import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { AlertTriangle, Database } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { Box } from '@/components/ui/box';
import { Separator } from '@/components/ui/separator';
import StripeTokenManager from '../../integrations/stripe/auth/stripeTokenManager';
import { StripeConnectTab } from './tabs/StripeConnectTab';
import { PaymentHistoryTab } from './tabs/PaymentHistoryTab';
import { PaymentSettingsTab } from './tabs/PaymentSettingsTab';
import { PaymentLoadingState } from './PaymentLoadingState';

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
  const [creatingAccount, setCreatingAccount] = useState(false);
  
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

  const handleConnectStripe = async () => {
    setCreatingAccount(true);
    setTimeout(() => {
      setCreatingAccount(false);
      setStripeConnected(true);
    }, 2000);
  };
  
  const handleManageAccount = async () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
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
    return <PaymentLoadingState />;
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
            <StripeConnectTab
              accountInfo={accountInfo}
              accountStatus={{}}
              stripeConnected={stripeConnected}
              loading={loading}
              creatingAccount={creatingAccount}
              error={error}
              handleConnectStripe={handleConnectStripe}
              handleConnectionStatusChange={handleConnectionStatusChange}
              handleManageAccount={handleManageAccount}
              formatDate={formatDate}
            />
          </TabsContent>
          
          <TabsContent value="history">
            <PaymentHistoryTab
              paymentRecords={paymentRecords}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
            />
          </TabsContent>
          
          <TabsContent value="settings">
            <PaymentSettingsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PaymentSettings;
