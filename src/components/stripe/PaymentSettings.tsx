import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useStripeConnect } from '@/hooks/useStripeConnect';
import { Loader2, ArrowRight, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function PaymentSettings() {
  const { user } = useAuth();
  const {
    loading, 
    error, 
    accountStatus,
    connectStripeAccount,
    getAccountStatus,
    createAccountLink
  } = useStripeConnect();
  
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (user?.id) {
      getAccountStatus(user.id);
    }
  }, [user?.id, getAccountStatus]);

  const handleConnectStripe = async () => {
    if (!user?.id) return;
    setIsProcessing(true);
    
    try {
      const url = await connectStripeAccount(user.id, window.location.href);
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Error connecting to Stripe:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompleteOnboarding = async () => {
    if (!accountStatus.accountId) return;
    
    setIsProcessing(true);
    try {
      const url = await createAccountLink(accountStatus.accountId);
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Error creating account link:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stripe Connect</CardTitle>
        <CardDescription>
          Connect your Stripe account to accept payments from clients
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : accountStatus.accountId ? (
          <div className="space-y-4">
            {accountStatus.chargesEnabled && accountStatus.payoutsEnabled ? (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle>Account Connected</AlertTitle>
                <AlertDescription>
                  Your Stripe account is connected and ready to accept payments.
                </AlertDescription>
              </Alert>
            ) : accountStatus.detailsSubmitted ? (
              <Alert className="bg-amber-50 border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle>Onboarding in Progress</AlertTitle>
                <AlertDescription>
                  Your account is connected but Stripe is still verifying your information.
                  This may take 24-48 hours.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="bg-amber-50 border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle>Onboarding Required</AlertTitle>
                <AlertDescription>
                  Your account is connected, but you need to complete the onboarding process.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Charges Enabled</p>
                  <p className="text-lg flex items-center gap-2">
                    {accountStatus.chargesEnabled ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Yes
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-600" />
                        No
                      </>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Payouts Enabled</p>
                  <p className="text-lg flex items-center gap-2">
                    {accountStatus.payoutsEnabled ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Yes
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-600" />
                        No
                      </>
                    )}
                  </p>
                </div>
              </div>

              {!accountStatus.chargesEnabled && (
                <Button 
                  onClick={handleCompleteOnboarding} 
                  disabled={isProcessing}
                  className="mt-4"
                >
                  {isProcessing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Complete Stripe Onboarding
                </Button>
              )}
            </div>
          </div>
        ) : error ? (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
            <Button onClick={handleConnectStripe} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Try Again
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center p-6 bg-muted/50 rounded-md">
              <h3 className="text-lg font-semibold">No Stripe Account Connected</h3>
              <p className="text-muted-foreground mt-2">
                Connect your Stripe account to start accepting payments from clients through our platform.
              </p>
              <div className="mt-4 flex items-center justify-center space-x-2">
                <Button
                  onClick={handleConnectStripe}
                  disabled={isProcessing}
                  className="bg-gradient-to-r from-violet-500 to-purple-600 flex items-center gap-2"
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Connect with Stripe
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Don't have a Stripe account? We'll help you create one.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
