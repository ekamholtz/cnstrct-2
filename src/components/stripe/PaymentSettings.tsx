import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  CircularProgress, 
  Divider, 
  Grid, 
  Paper, 
  Tab, 
  Tabs, 
  Typography, 
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { useAuth } from '../../hooks/useAuth';
import { createClient } from '@supabase/supabase-js';
import StripeConnectButton from './StripeConnectButton';
import StripeTokenManager from '../../integrations/stripe/auth/stripeTokenManager';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`payment-settings-tabpanel-${index}`}
      aria-labelledby={`payment-settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

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
      <Alert severity="warning">
        You must be logged in to access payment settings.
      </Alert>
    );
  }
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Paper elevation={1} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Payment Settings
      </Typography>
      
      <Divider sx={{ mb: 3 }} />
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="payment settings tabs">
            <Tab label="Stripe Connect" />
            <Tab label="Payment History" disabled={!stripeConnected} />
            <Tab label="Settings" disabled={!stripeConnected} />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Connect Your Stripe Account
                  </Typography>
                  
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Connect your Stripe account to start accepting payments for your invoices.
                  </Typography>
                  
                  <StripeConnectButton 
                    onStatusChange={handleConnectionStatusChange}
                    redirectPath="/settings/payments"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
          
          {stripeConnected && accountInfo && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Connected Account
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2">
                      <strong>Account Name:</strong> {accountInfo.account_name}
                    </Typography>
                    
                    <Typography variant="body2">
                      <strong>Email:</strong> {accountInfo.account_email}
                    </Typography>
                    
                    <Typography variant="body2">
                      <strong>Status:</strong> {accountInfo.account_status}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2">
                      <strong>Account ID:</strong> {accountInfo.account_id}
                    </Typography>
                    
                    <Typography variant="body2">
                      <strong>Connected:</strong> {formatDate(accountInfo.created_at)}
                    </Typography>
                    
                    <Typography variant="body2">
                      <strong>Default Account:</strong> {accountInfo.default_account ? 'Yes' : 'No'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sx={{ mt: 2 }}>
                    <Button 
                      variant="contained" 
                      color="primary"
                      href="https://dashboard.stripe.com" 
                      target="_blank"
                      sx={{ mr: 2 }}
                    >
                      Stripe Dashboard
                    </Button>
                    
                    <Button 
                      variant="outlined" 
                      color="error"
                      onClick={() => {
                        // Implement disconnect functionality here
                        alert('This would disconnect your Stripe account. Functionality not yet implemented.');
                      }}
                    >
                      Disconnect Account
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Payment History
          </Typography>
          
          {paymentRecords.length === 0 ? (
            <Alert severity="info">
              No payment records found. When you start receiving payments, they will appear here.
            </Alert>
          ) : (
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Invoice</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Payment Method</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
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
                        <Box sx={{ 
                          display: 'inline-block', 
                          px: 1, 
                          py: 0.5, 
                          borderRadius: 1,
                          backgroundColor: 
                            record.status === 'succeeded' ? 'success.light' : 
                            record.status === 'failed' ? 'error.light' : 
                            'warning.light',
                          color: 'white'
                        }}>
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Payment Settings
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Platform Fee
                  </Typography>
                  
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    The platform fee is automatically calculated and applied to all payments.
                  </Typography>
                  
                  <Typography variant="h6">
                    {import.meta.env.VITE_STRIPE_PLATFORM_FEE_PERCENTAGE || '2.5'}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Payment Methods
                  </Typography>
                  
                  <Typography variant="body2">
                    The following payment methods are enabled for your account:
                  </Typography>
                  
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2">✅ Credit and Debit Cards</Typography>
                    <Typography variant="body2">✅ ACH Direct Debit (US only)</Typography>
                    <Typography variant="body2">✅ Bank Transfers</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12}>
              <Alert severity="info">
                Additional payment settings are managed directly through your Stripe Dashboard.
              </Alert>
            </Grid>
          </Grid>
        </TabPanel>
      </Box>
    </Paper>
  );
};

export default PaymentSettings;
