import React, { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { createPaymentLink, getStripeAccessToken } from '@/integrations/stripe/services/StripePaymentService';
import { Copy, Check, Link } from 'lucide-react';

interface CreatePaymentLinkFormProps {
  accountId: string;
}

export function CreatePaymentLinkForm({ accountId }: CreatePaymentLinkFormProps) {
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('usd');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  
  const supabase = useSupabaseClient();
  const { toast } = useToast();
  
  // Fetch projects for the dropdown
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const { data, error } = await supabase
          .from('projects')
          .select('id, name')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setProjects(data || []);
      } catch (err) {
        console.error('Error fetching projects:', err);
      }
    };
    
    fetchProjects();
  }, [supabase]);
  
  // Fetch invoices for the selected project
  useEffect(() => {
    const fetchInvoices = async () => {
      if (!selectedProject) {
        setInvoices([]);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('invoices')
          .select('id, invoice_number, amount')
          .eq('project_id', selectedProject)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setInvoices(data || []);
      } catch (err) {
        console.error('Error fetching invoices:', err);
      }
    };
    
    fetchInvoices();
  }, [selectedProject, supabase]);
  
  // Handle selecting an invoice
  useEffect(() => {
    if (selectedInvoice) {
      const invoice = invoices.find(inv => inv.id === selectedInvoice);
      if (invoice) {
        setAmount(invoice.amount.toString());
        setDescription(`Payment for Invoice #${invoice.invoice_number}`);
      }
    }
  }, [selectedInvoice, invoices]);
  
  const handleCreatePaymentLink = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const amountInCents = Math.round(parseFloat(amount) * 100);
      
      // Platform fee calculation (you can adjust this as needed)
      const platformFeePercentage = 2.5; // 2.5%
      const platformFee = Math.round(amountInCents * (platformFeePercentage / 100));
      
      const metadata: any = {
        description,
      };
      
      if (selectedProject) {
        metadata.project_id = selectedProject;
      }
      
      if (selectedInvoice) {
        metadata.invoice_id = selectedInvoice;
      }
      
      const accessToken = await getStripeAccessToken();
      if (!accessToken) {
        throw new Error('Failed to get Stripe access token');
      }
      
      const result = await createPaymentLink(
        amountInCents,
        currency,
        accountId,
        accessToken,
        platformFee,
        metadata
      );
      
      // Save payment link to database
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const { error: dbError } = await supabase
        .from('payment_links')
        .insert({
          stripe_payment_link_id: result.id,
          user_id: user.id,
          account_id: accountId,
          amount: amountInCents,
          currency,
          url: result.url,
          invoice_id: selectedInvoice || null,
          project_id: selectedProject || null,
          platform_fee: platformFee,
          metadata: metadata
        });
      
      if (dbError) throw dbError;
      
      setPaymentLink(result.url);
      
      toast({
        title: 'Payment Link Created',
        description: 'Your payment link has been successfully created!',
        duration: 5000,
      });
      
      // If this is for an invoice, update the invoice record
      if (selectedInvoice) {
        await supabase
          .from('invoices')
          .update({
            payment_link: result.url,
            rainforest_payment_session_id: result.id,
            payment_status: 'PENDING'
          })
          .eq('id', selectedInvoice);
      }
    } catch (err: any) {
      console.error('Error creating payment link:', err);
      setError(err.message || 'Failed to create payment link');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCopyLink = () => {
    if (paymentLink) {
      navigator.clipboard.writeText(paymentLink);
      setCopied(true);
      
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
  };
  
  const handleReset = () => {
    setAmount('');
    setCurrency('usd');
    setDescription('');
    setPaymentLink(null);
    setSelectedProject(null);
    setSelectedInvoice(null);
    setError(null);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Payment Link</CardTitle>
        <CardDescription>
          Generate a payment link to share with your customers
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {paymentLink ? (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Payment Link Created</h3>
            
            <div className="flex items-center space-x-2">
              <Input
                value={paymentLink}
                readOnly
                className="flex-1"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={handleCopyLink}
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={() => window.open(paymentLink, '_blank')}
              >
                <Link className="h-4 w-4" />
              </Button>
            </div>
            
            <Button
              variant="outline"
              onClick={handleReset}
              className="mt-4"
            >
              Create Another Payment Link
            </Button>
          </div>
        ) : (
          <form onSubmit={handleCreatePaymentLink} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project">Project (Optional)</Label>
              <Select
                value={selectedProject || ''}
                onValueChange={setSelectedProject}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedProject && (
              <div className="space-y-2">
                <Label htmlFor="invoice">Invoice (Optional)</Label>
                <Select
                  value={selectedInvoice || ''}
                  onValueChange={setSelectedInvoice}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an invoice" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {invoices.map(invoice => (
                      <SelectItem key={invoice.id} value={invoice.id}>
                        Invoice #{invoice.invoice_number} - ${invoice.amount}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="flex">
                <Select
                  value={currency}
                  onValueChange={setCurrency}
                  defaultValue="usd"
                >
                  <SelectTrigger className="w-24">
                    <SelectValue placeholder="USD" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usd">USD</SelectItem>
                    <SelectItem value="cad">CAD</SelectItem>
                    <SelectItem value="eur">EUR</SelectItem>
                    <SelectItem value="gbp">GBP</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="flex-1 ml-2"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter a description for this payment"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Creating...' : 'Create Payment Link'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
