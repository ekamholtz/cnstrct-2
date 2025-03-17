import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPaymentLink } from '@/integrations/stripe/services/StripePaymentService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { ArrowLeft, Copy, CheckCircle } from 'lucide-react';

const CreatePaymentLink = () => {
  const [loading, setLoading] = useState(false);
  const [connectedAccount, setConnectedAccount] = useState<any>(null);
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    customerEmail: '',
    customerName: '',
    projectId: '',
  });
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const supabase = useSupabaseClient();
  
  // Platform fee percentage (e.g., 2.5%)
  const platformFeePercentage = 0.025;
  
  useEffect(() => {
    // Check if the user has a connected Stripe account
    const checkConnectedAccount = async () => {
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
              description: 'You need to connect a Stripe account before creating payment links.',
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
        
        if (!accountData.charges_enabled) {
          toast({
            title: 'Account Setup Incomplete',
            description: 'Your Stripe account setup is incomplete. Please complete the onboarding process.',
            variant: 'destructive',
            duration: 5000,
          });
          navigate('/settings/payments');
          return;
        }
        
        setConnectedAccount(accountData);
      } catch (err) {
        console.error('Error checking connected account:', err);
        setError('Failed to check account status');
      } finally {
        setLoading(false);
      }
    };
    
    checkConnectedAccount();
  }, [navigate, supabase, toast]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleCreatePaymentLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPaymentLink(null);
    
    try {
      // Validate form data
      if (!formData.amount || isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
        setError('Please enter a valid amount');
        return;
      }
      
      if (!formData.description) {
        setError('Please enter a description');
        return;
      }
      
      // Convert amount to cents
      const amountInCents = Math.round(parseFloat(formData.amount) * 100);
      
      // Calculate platform fee
      const platformFeeAmount = Math.round(amountInCents * platformFeePercentage);
      
      // Get the access token from secure storage
      // This is a placeholder - you'll need to implement secure token storage
      const accessToken = 'YOUR_STRIPE_ACCESS_TOKEN';
      
      // Create the payment link
      const paymentLinkData = await createPaymentLink(
        amountInCents,
        'usd',
        connectedAccount.account_id,
        accessToken,
        platformFeeAmount,
        {
          description: formData.description,
          customer_email: formData.customerEmail,
          customer_name: formData.customerName,
          project_id: formData.projectId,
        }
      );
      
      // Store the payment link in the database
      const { error: insertError } = await supabase
        .from('payment_links')
        .insert({
          user_id: connectedAccount.user_id,
          stripe_account_id: connectedAccount.account_id,
          payment_link_id: paymentLinkData.id,
          amount: amountInCents,
          currency: 'usd',
          description: formData.description,
          customer_email: formData.customerEmail,
          customer_name: formData.customerName,
          project_id: formData.projectId,
          platform_fee: platformFeeAmount,
          status: 'active',
          url: paymentLinkData.url
        });
      
      if (insertError) {
        console.error('Error storing payment link:', insertError);
        setError('Failed to store payment link information');
        return;
      }
      
      setPaymentLink(paymentLinkData.url);
      
      toast({
        title: 'Payment Link Created',
        description: 'Your payment link has been successfully created!',
        duration: 5000,
      });
    } catch (err: any) {
      console.error('Error creating payment link:', err);
      setError(err.message || 'Failed to create payment link');
      
      toast({
        title: 'Creation Failed',
        description: 'There was a problem creating your payment link. Please try again.',
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleCopyLink = () => {
    if (paymentLink) {
      navigator.clipboard.writeText(paymentLink);
      setCopied(true);
      
      toast({
        title: 'Copied!',
        description: 'Payment link copied to clipboard',
        duration: 3000,
      });
      
      setTimeout(() => {
        setCopied(false);
      }, 3000);
    }
  };
  
  const handleGoBack = () => {
    navigate(-1);
  };
  
  // Calculate the estimated platform fee
  const estimatedFee = formData.amount 
    ? `$${(parseFloat(formData.amount) * platformFeePercentage).toFixed(2)}`
    : '$0.00';
  
  // Calculate the estimated payout
  const estimatedPayout = formData.amount
    ? `$${(parseFloat(formData.amount) * (1 - platformFeePercentage)).toFixed(2)}`
    : '$0.00';
  
  return (
    <div className="container mx-auto py-8 px-4">
      <Button variant="ghost" className="mb-4" onClick={handleGoBack}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Create Payment Link</CardTitle>
          <CardDescription>
            Create a payment link to send to your customers
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
              
              <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded border">
                <div className="flex-1 truncate">
                  <a href={paymentLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {paymentLink}
                  </a>
                </div>
                <Button size="sm" variant="outline" onClick={handleCopyLink}>
                  {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              
              <p className="text-sm text-gray-600">
                Share this link with your customer to collect payment. The link will remain active until payment is made.
              </p>
              
              <div className="mt-4">
                <Button onClick={() => setPaymentLink(null)}>Create Another Link</Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreatePaymentLink} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount ($)</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="e.g., Kitchen Renovation - Final Payment"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name (Optional)</Label>
                <Input
                  id="customerName"
                  name="customerName"
                  placeholder="John Doe"
                  value={formData.customerName}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="customerEmail">Customer Email (Optional)</Label>
                <Input
                  id="customerEmail"
                  name="customerEmail"
                  type="email"
                  placeholder="customer@example.com"
                  value={formData.customerEmail}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="projectId">Project ID (Optional)</Label>
                <Input
                  id="projectId"
                  name="projectId"
                  placeholder="Project ID or reference"
                  value={formData.projectId}
                  onChange={handleInputChange}
                />
              </div>
              
              {formData.amount && (
                <div className="bg-gray-50 p-4 rounded border mt-4">
                  <h4 className="font-medium mb-2">Payment Summary</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Customer pays:</div>
                    <div className="text-right">${parseFloat(formData.amount).toFixed(2)}</div>
                    
                    <div>Platform fee ({(platformFeePercentage * 100).toFixed(1)}%):</div>
                    <div className="text-right">{estimatedFee}</div>
                    
                    <div className="font-medium">You receive:</div>
                    <div className="text-right font-medium">{estimatedPayout}</div>
                  </div>
                </div>
              )}
            </form>
          )}
        </CardContent>
        
        {!paymentLink && (
          <CardFooter>
            <Button 
              type="submit"
              onClick={handleCreatePaymentLink}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Creating...' : 'Create Payment Link'}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default CreatePaymentLink;
