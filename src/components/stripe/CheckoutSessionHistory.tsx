import React, { useEffect, useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { listCheckoutSessions } from '@/integrations/stripe/services/StripeCheckoutService';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { RefreshCcw, ExternalLink } from 'lucide-react';

// Format currency amounts
const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
};

// Format dates
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString();
};

// Status badge variant mapping
const getStatusVariant = (status: string): "default" | "destructive" | "outline" | "secondary" => {
  switch (status) {
    case 'completed':
    case 'succeeded':
      return 'default';
    case 'pending':
    case 'processing':
      return 'secondary';
    case 'expired':
    case 'failed':
      return 'destructive';
    default:
      return 'outline';
  }
};

interface CheckoutSessionHistoryProps {
  limit?: number;
  showRefresh?: boolean;
}

const CheckoutSessionHistory: React.FC<CheckoutSessionHistoryProps> = ({
  limit = 10,
  showRefresh = true,
}) => {
  const supabase = useSupabaseClient();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Get user's GC account from profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('gc_account_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.gc_account_id) {
        throw new Error('GC Account not found for this user');
      }

      const gcAccountId = profile.gc_account_id;
      
      // Fetch checkout sessions
      const sessionsData = await listCheckoutSessions(user.id, gcAccountId, limit);
      setSessions(sessionsData);
    } catch (error: any) {
      console.error('Error fetching checkout sessions:', error);
      toast({
        title: 'Error fetching sessions',
        description: error.message || 'Could not load checkout sessions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRefresh = () => {
    fetchSessions();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>View your recent payment transactions</CardDescription>
          </div>
          {showRefresh && (
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff6b24]"></div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No payment records found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>{formatDate(session.created_at)}</TableCell>
                    <TableCell>
                      {session.description || 
                        (session.metadata?.description ? session.metadata.description : 'Payment')}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(session.amount, session.currency)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(session.status)}>
                        {session.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {/* Show receipt URL if available */}
                        {session.metadata?.receipt_url && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={session.metadata.receipt_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Receipt
                            </a>
                          </Button>
                        )}
                        
                        {/* If session is still open (created but not completed/expired), show checkout link */}
                        {session.status === 'created' && session.metadata?.url && (
                          <Button size="sm" variant="default" asChild>
                            <a href={session.metadata.url} target="_blank" rel="noopener noreferrer">
                              Pay
                            </a>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CheckoutSessionHistory;
