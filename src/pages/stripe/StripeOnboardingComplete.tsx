
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useToast } from '@/components/ui/use-toast';
import { getConnectedAccountFromDB, getConnectedAccount, getStripeAccessToken, saveConnectedAccount } from '@/integrations/stripe/services/StripeConnectService';

const StripeOnboardingComplete = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const supabase = useSupabaseClient();
  
  useEffect(() => {
    const updateAccountStatus = async () => {
      try {
        setLoading(true);
        
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/auth');
          return;
        }
        
        // Get the access token
        const accessToken = await getStripeAccessToken();
        if (!accessToken) {
          setError('Could not retrieve Stripe access token');
          return;
        }
        
        // Get the connected account from the database
        const accountData = await getConnectedAccountFromDB(user.id);
        if (!accountData || !accountData.account_id) {
          setError('No Stripe Connect account found');
          return;
        }
        
        // Get the latest account details from Stripe
        const accountDetails = await getConnectedAccount(accountData.account_id, accessToken);
        
        // Update the account in the database
        await saveConnectedAccount(user.id, accountData.account_id, accountDetails);
        
        setSuccess(true);
        
        toast({
          title: 'Stripe Connect Account Updated',
          description: 'Your Stripe Connect account information has been updated successfully.',
          duration: 5000,
        });
      } catch (err: any) {
        console.error('Error updating Stripe account status:', err);
        setError(err.message || 'Failed to update Stripe account status');
        
        toast({
          title: 'Error',
          description: 'Failed to update Stripe account status. Please try again.',
          variant: 'destructive',
          duration: 5000,
        });
      } finally {
        setLoading(false);
      }
    };
    
    updateAccountStatus();
  }, [navigate, supabase, toast]);
  
  return (
    <div className="container mx-auto py-16 px-4 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Stripe Onboarding</CardTitle>
          <CardDescription>
            Processing your Stripe Connect account
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-cnstrct-navy mb-4" />
              <p className="text-lg text-center">
                Updating your Stripe Connect account information...
              </p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              <p className="font-semibold">Error</p>
              <p>{error}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <h3 className="text-xl font-medium text-center mb-2">
                Stripe Connect Account Updated
              </h3>
              <p className="text-center text-gray-600">
                Your Stripe Connect account has been successfully updated. You can now start accepting payments from your customers.
              </p>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-center">
          <Button asChild disabled={loading}>
            <Link to="/settings/payments">
              Return to Payment Settings
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default StripeOnboardingComplete;
