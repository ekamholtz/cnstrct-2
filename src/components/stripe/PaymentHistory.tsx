import React, { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ExternalLink, Download, MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function PaymentHistory() {
  const [paymentLinks, setPaymentLinks] = useState<any[]>([]);
  const [paymentRecords, setPaymentRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('links');
  
  const supabase = useSupabaseClient();
  
  useEffect(() => {
    const fetchPaymentData = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('User not authenticated');
        }
        
        // Fetch payment links
        const { data: links, error: linksError } = await supabase
          .from('payment_links')
          .select(`
            *,
            projects(name),
            invoices(invoice_number)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (linksError) throw linksError;
        setPaymentLinks(links || []);
        
        // Fetch payment records
        const { data: records, error: recordsError } = await supabase
          .from('payment_records')
          .select(`
            *,
            projects(name),
            invoices(invoice_number),
            payment_links(url)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (recordsError) throw recordsError;
        setPaymentRecords(records || []);
      } catch (err: any) {
        console.error('Error fetching payment data:', err);
        setError(err.message || 'Failed to load payment history');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPaymentData();
  }, [supabase]);
  
  const getStatusBadge = (status: string) => {
    let variant = 'secondary';
    
    switch (status.toLowerCase()) {
      case 'succeeded':
      case 'paid':
      case 'complete':
        variant = 'success';
        break;
      case 'pending':
      case 'processing':
        variant = 'warning';
        break;
      case 'failed':
      case 'canceled':
        variant = 'destructive';
        break;
      default:
        variant = 'secondary';
    }
    
    return (
      <Badge variant={variant as any}>
        {status}
      </Badge>
    );
  };
  
  const formatCurrency = (amount: number, currency: string) => {
    const amountNumber = amount / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amountNumber);
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} (${formatDistanceToNow(date, { addSuffix: true })})`;
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff6b24]"></div>
      </div>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment History</CardTitle>
        <CardDescription>View your payment links and transactions</CardDescription>
      </CardHeader>
      
      <CardContent>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <Tabs
          defaultValue="links"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="links">Payment Links</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="links" className="mt-4">
            {paymentLinks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No payment links found. Create a payment link to get started.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentLinks.map((link) => (
                      <TableRow key={link.id}>
                        <TableCell>
                          <div>
                            {link.metadata?.description || 'Payment'}
                            {link.invoices?.invoice_number && (
                              <div className="text-xs text-gray-500">
                                Invoice #{link.invoices.invoice_number}
                              </div>
                            )}
                            {link.projects?.name && (
                              <div className="text-xs text-gray-500">
                                Project: {link.projects.name}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatCurrency(link.amount, link.currency)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(link.status)}
                        </TableCell>
                        <TableCell>
                          {formatDate(link.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => window.open(link.url, '_blank')}>
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Open Link
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(link.url)}>
                                <Download className="mr-2 h-4 w-4" />
                                Copy Link
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="transactions" className="mt-4">
            {paymentRecords.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No payment transactions found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div>
                            {record.metadata?.description || 'Payment'}
                            {record.invoices?.invoice_number && (
                              <div className="text-xs text-gray-500">
                                Invoice #{record.invoices.invoice_number}
                              </div>
                            )}
                            {record.projects?.name && (
                              <div className="text-xs text-gray-500">
                                Project: {record.projects.name}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatCurrency(record.amount, record.currency)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(record.status)}
                        </TableCell>
                        <TableCell>
                          {formatDate(record.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="capitalize">
                            {record.payment_method_type || 'Unknown'}
                            {record.payment_method_details?.last4 && (
                              <span className="text-xs text-gray-500 ml-1">
                                •••• {record.payment_method_details.last4}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Download className="mr-2 h-4 w-4" />
                                Download Receipt
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
