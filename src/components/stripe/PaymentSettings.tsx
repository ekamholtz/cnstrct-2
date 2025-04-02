
import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useStripeConnect } from '@/hooks/useStripeConnect';
import { Loader2 } from 'lucide-react';

export function PaymentSettings() {
  const {
    account,
    isLoading,
    connectToStripe,
    disconnectFromStripe,
  } = useStripeConnect();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stripe Connect</CardTitle>
        <CardDescription>
          Connect your Stripe account to accept payments from clients
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : account ? (
          <div className="space-y-4">
            <div className="rounded-md bg-green-50 p-4 border border-green-200">
              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-green-800">Account Connected</h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>
                      Your Stripe account is connected and ready to accept payments.
                    </p>
                  </div>
                  <div className="mt-4">
                    <Button 
                      variant="destructive"
                      onClick={disconnectFromStripe}
                      size="sm"
                    >
                      Disconnect Account
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Charges Enabled</p>
                  <p className="text-lg">{account.charges_enabled ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Payouts Enabled</p>
                  <p className="text-lg">{account.payouts_enabled ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center p-6 bg-muted/50 rounded-md">
              <h3 className="text-lg font-semibold">No Stripe Account Connected</h3>
              <p className="text-muted-foreground mt-2">
                Connect your Stripe account to start accepting payments from clients.
              </p>
              <Button
                onClick={connectToStripe}
                className="mt-4 bg-gradient-to-r from-violet-500 to-purple-600"
              >
                Connect with Stripe
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
