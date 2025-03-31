
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { AlertCircle, Check, ExternalLink, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export function StripeConnectSettings() {
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [account, setAccount] = useState<any>(null);
  const [gcAccountId, setGcAccountId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchStripeAccount = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('User not authenticated');
        }
        
        // Get GC account ID
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('gc_account_id')
          .eq('id', user.id)
          .single();
          
        if (profileError) throw profileError;
        if (!profile?.gc_account_id) {
          throw new Error('No GC account associated with this user');
        }
        
        setGcAccountId(profile.gc_account_id);
        
        // Check for existing Stripe Connect account
        const { data: connectAccount, error: connectError } = await supabase
          .from('stripe_connect_accounts')
          .select('*')
          .eq('gc_account_id', profile.gc_account_id)
          .maybeSingle();
          
        if (connectError && connectError.code !== 'PGRST116') throw connectError;
        
        if (connectAccount) {
          // Get more details by calling the edge function
          const { data: sessionData } = await supabase.auth.getSession();
          if (!sessionData?.session) throw new Error('No auth session found');
          
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-connect`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${sessionData.session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'get-account',
              accountId: connectAccount.account_id,
            }),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch account details');
          }
          
          const accountData = await response.json();
          setAccount(accountData);
        }
      } catch (err) {
        console.error('Error fetching Stripe account:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStripeAccount();
  }, []);

  const handleConnectStripe = async () => {
    try {
      if (!gcAccountId) {
        throw new Error('No GC account ID found');
      }
      
      setConnecting(true);
      setError(null);
      
      // Get auth session
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        throw new Error('No auth session found');
      }
      
      // Call Stripe Connect edge function to initiate OAuth
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-connect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionData.session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'initiate-oauth',
          gcAccountId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to initiate Stripe Connect');
      }
      
      const { url } = await response.json();
      
      // Redirect to Stripe Connect OAuth
      window.location.href = url;
    } catch (err) {
      console.error('Error connecting Stripe:', err);
      setError(err.message);
      setConnecting(false);
      
      toast({
        variant: 'destructive',
        title: 'Connection Error',
        description: err.message || 'Failed to connect to Stripe',
      });
    }
  };

  const handleUpdateStripeAccount = async () => {
    try {
      if (!account?.id) {
        throw new Error('No Stripe account found');
      }
      
      setConnecting(true);
      setError(null);
      
      // Get auth session
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        throw new Error('No auth session found');
      }
      
      // Call Stripe Connect edge function to create account link
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-connect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionData.session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create-account-link',
          accountId: account.id,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create account link');
      }
      
      const { url } = await response.json();
      
      // Redirect to Stripe account update page
      window.location.href = url;
    } catch (err) {
      console.error('Error updating Stripe account:', err);
      setError(err.message);
      setConnecting(false);
      
      toast({
        variant: 'destructive',
        title: 'Update Error',
        description: err.message || 'Failed to update Stripe account',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-cnstrct-orange" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {account ? (
        <div className="space-y-4">
          <Alert variant="success" className="bg-green-50 border-green-100 text-green-800">
            <Check className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Stripe Connected</AlertTitle>
            <AlertDescription className="text-green-700">
              <div className="space-y-2 mt-2 text-sm">
                <p><span className="font-medium">Business Name:</span> {account.business_profile?.name || 'Not provided'}</p>
                <p><span className="font-medium">Account ID:</span> {account.id}</p>
                <p>
                  <span className="font-medium">Onboarding Status:</span>{' '}
                  {account.charges_enabled ? 'Complete' : 'Incomplete'}
                </p>
              </div>
            </AlertDescription>
          </Alert>
          
          {!account.charges_enabled && (
            <Alert variant="warning" className="bg-yellow-50 border-yellow-100 text-yellow-800">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertTitle className="text-yellow-800">Account Incomplete</AlertTitle>
              <AlertDescription className="text-yellow-700">
                Your Stripe account setup is not complete. Please finish the onboarding process to enable payments.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="flex gap-4">
            <Button 
              onClick={handleUpdateStripeAccount}
              disabled={connecting}
              className="flex-1"
            >
              {connecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {account.charges_enabled ? 'Update Account' : 'Complete Onboarding'}
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => window.open('https://dashboard.stripe.com/dashboard', '_blank')}
              className="flex-1"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Stripe Dashboard
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Connect your Stripe account to accept payments directly from clients. This allows you to:
          </p>
          
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
            <li>Accept credit card payments</li>
            <li>Process invoice payments online</li>
            <li>Access payment analytics</li>
            <li>Get paid faster with automatic deposits</li>
          </ul>
          
          <Button 
            onClick={handleConnectStripe}
            disabled={connecting}
            className="w-full"
          >
            {connecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Connect Stripe Account
          </Button>
        </div>
      )}
    </div>
  );
}
