import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { ArrowLeft, ExternalLink, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

const PaymentHistory = () => {
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const supabase = useSupabaseClient();
  
  useEffect(() => {
    // Fetch payment history
    const fetchPaymentHistory = async () => {
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
        
        if (accountError) {
          if (accountError.code === 'PGRST116') {
            // No account found
            toast({
              title: 'Stripe Account Required',
              description: 'You need to connect a Stripe account to view payment history.',
              variant: 'destructive',
              duration: 5000,
            });
            navigate('/settings/payments');
            return;
          }
          
          console.error('Error fetching Stripe account:', accountError);
          setError('Failed to fetch account information');
          return;
        }
        
        // Fetch payment links from the database
        const { data: paymentLinksData, error: paymentLinksError } = await supabase
          .from('payment_links')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (paymentLinksError) {
          console.error('Error fetching payment links:', paymentLinksError);
          setError('Failed to fetch payment history');
          return;
        }
        
        // Fetch payment records from the database
        const { data: paymentRecordsData, error: paymentRecordsError } = await supabase
          .from('payment_records')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (paymentRecordsError) {
          console.error('Error fetching payment records:', paymentRecordsError);
          setError('Failed to fetch payment history');
          return;
        }
        
        // Combine payment links and records
        const combinedPayments = [
          ...(paymentLinksData || []).map((link: any) => ({
            ...link,
            type: 'link',
            status: link.status || 'pending'
          })),
          ...(paymentRecordsData || []).map((record: any) => ({
            ...record,
            type: 'payment',
            status: record.status || 'succeeded'
          }))
        ];
        
        // Sort by created_at
        combinedPayments.sort((a, b) => {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        
        setPayments(combinedPayments);
      } catch (err) {
        console.error('Error fetching payment history:', err);
        setError('Failed to fetch payment history');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPaymentHistory();
  }, [navigate, supabase, toast]);
  
  const handleGoBack = () => {
    navigate(-1);
  };
  
  const formatCurrency = (amount: number, currency: string = 'usd') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100);
  };
  
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'succeeded':
      case 'paid':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Paid</span>;
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>;
      case 'failed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Failed</span>;
      case 'canceled':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Canceled</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{status}</span>;
    }
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <Button variant="ghost" className="mb-4" onClick={handleGoBack}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Payment History</CardTitle>
          <CardDescription>
            View all your payment links and received payments
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading payment history...</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8 space-y-4">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto" />
              <h3 className="text-lg font-medium text-gray-900">No payments found</h3>
              <p className="text-gray-600">You haven't created any payment links or received any payments yet.</p>
              <Button onClick={() => navigate('/payments/create')}>
                Create Payment Link
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        {format(new Date(payment.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        {payment.description || 'N/A'}
                        {payment.project_id && (
                          <div className="text-xs text-gray-500">
                            Project: {payment.project_id}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {payment.customer_name || 'N/A'}
                        {payment.customer_email && (
                          <div className="text-xs text-gray-500">
                            {payment.customer_email}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(payment.amount, payment.currency)}
                        {payment.platform_fee > 0 && (
                          <div className="text-xs text-gray-500">
                            Fee: {formatCurrency(payment.platform_fee, payment.currency)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(payment.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        {payment.type === 'link' && payment.url && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={payment.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-1" />
                              View
                            </a>
                          </Button>
                        )}
                        {payment.type === 'payment' && payment.payment_intent_id && (
                          <Button size="sm" variant="outline" onClick={() => navigate(`/payments/details/${payment.payment_intent_id}`)}>
                            Details
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentHistory;
