import React, { useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { createCheckoutSession, storeCheckoutSession } from '@/integrations/stripe/services/StripeCheckoutService';
import { getConnectedAccountFromDB } from '@/integrations/stripe/services/StripeConnectService';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

// Set currency formatting
const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

interface CreateCheckoutSessionFormProps {
  invoiceId?: string;
  projectId?: string;
  onSuccess?: (data: any) => void;
}

const CreateCheckoutSessionForm: React.FC<CreateCheckoutSessionFormProps> = ({ 
  invoiceId,
  projectId,
  onSuccess 
}) => {
  const supabase = useSupabaseClient();
  const { toast } = useToast();

  // Form state
  const [amount, setAmount] = useState<number>(100); // Default $1.00
  const [currency, setCurrency] = useState<string>('usd');
  const [description, setDescription] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string>('');

  // Calculate the display amount (convert from cents to dollars)
  const displayAmount = amount / 100;
  const platformFeePercentage = process.env.NEXT_PUBLIC_STRIPE_PLATFORM_FEE_PERCENTAGE 
    ? parseFloat(process.env.NEXT_PUBLIC_STRIPE_PLATFORM_FEE_PERCENTAGE) 
    : 0.025; // Default to 2.5%
  
  // Calculate platform fee
  const platformFee = Math.round(amount * platformFeePercentage);
  const displayPlatformFee = platformFee / 100;
  
  // Calculate net amount (after platform fee)
  const netAmount = amount - platformFee;
  const displayNetAmount = netAmount / 100;

  // Handle form submission
  const handleCreateCheckoutSession = async (e: React.FormEvent) => {
    e.preventDefault();
    
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

      // Get connected account from database
      const connectedAccount = await getConnectedAccountFromDB(user.id);
      
      if (!connectedAccount || !connectedAccount.account_id) {
        toast({
          title: 'Error',
          description: 'Stripe Connect account not found. Please connect your account first.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Create metadata based on invoice or project
      const metadata: Record<string, any> = {
        description,
        user_id: user.id,
        gc_account_id: gcAccountId,
        connected_account_id: connectedAccount.account_id,
      };

      if (invoiceId) {
        metadata.invoice_id = invoiceId;
        metadata.payment_type = 'invoice';
      } else if (projectId) {
        metadata.project_id = projectId;
        metadata.payment_type = 'project';
      } else {
        metadata.payment_type = 'ad-hoc';
      }

      // Create checkout session
      const sessionResponse = await createCheckoutSession(
        amount,
        currency,
        connectedAccount.account_id,
        description || 'Payment',
        metadata
      );

      // Store checkout session in database
      await storeCheckoutSession(
        user.id,
        gcAccountId,
        sessionResponse
      );

      // Set checkout URL for redirection
      setCheckoutUrl(sessionResponse.url);

      toast({
        title: 'Success',
        description: 'Checkout session created successfully',
      });

      if (onSuccess) {
        onSuccess(sessionResponse);
      }
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create checkout session',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Payment</CardTitle>
        <CardDescription>Create a new checkout session for your customer</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreateCheckoutSession} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Payment description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              min="0.01"
              step="0.01"
              value={displayAmount}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                if (!isNaN(value)) {
                  setAmount(Math.round(value * 100)); // Convert dollars to cents
                }
              }}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select value={currency} onValueChange={(value) => setCurrency(value)}>
              <SelectTrigger id="currency">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="usd">USD</SelectItem>
                <SelectItem value="cad">CAD</SelectItem>
                <SelectItem value="eur">EUR</SelectItem>
                <SelectItem value="gbp">GBP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-gray-50 p-4 rounded-md space-y-2">
            <h4 className="font-medium">Payment Summary</h4>
            <div className="flex justify-between">
              <span>Total Amount:</span>
              <span>{currencyFormatter.format(displayAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Platform Fee ({(platformFeePercentage * 100).toFixed(1)}%):</span>
              <span>{currencyFormatter.format(displayPlatformFee)}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Net Amount:</span>
              <span>{currencyFormatter.format(displayNetAmount)}</span>
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-end">
        {checkoutUrl ? (
          <Button 
            className="w-full"
            asChild
          >
            <a href={checkoutUrl} target="_blank" rel="noopener noreferrer">
              Proceed to Checkout
            </a>
          </Button>
        ) : (
          <Button 
            type="submit" 
            onClick={handleCreateCheckoutSession}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Creating...' : 'Create Payment Link'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default CreateCheckoutSessionForm;
