
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, XCircle, Loader2, ExternalLink } from 'lucide-react';
import StripeConnectButton from '../StripeConnectButton';

interface StripeAccountStatus {
  accountId?: string;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  detailsSubmitted?: boolean;
}

interface StripeAccount {
  id: string;
  user_id: string;
  account_id: string;
  account_name: string;
  account_email: string;
  default_account: boolean;
  account_status: string;
  created_at: string;
  updated_at: string;
}

interface StripeConnectTabProps {
  accountInfo: StripeAccount | null;
  accountStatus: StripeAccountStatus;
  stripeConnected: boolean;
  loading: boolean;
  creatingAccount?: boolean;
  error: string | null;
  handleConnectStripe: () => Promise<void>;
  handleConnectionStatusChange: (isConnected: boolean) => void;
  handleManageAccount: () => Promise<void>;
  formatDate: (dateString: string) => string;
}

export function StripeConnectTab({
  accountInfo,
  accountStatus,
  stripeConnected,
  loading,
  creatingAccount = false,
  error,
  handleConnectStripe,
  handleConnectionStatusChange,
  handleManageAccount,
  formatDate
}: StripeConnectTabProps) {
  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Connect Your Stripe Account</CardTitle>
          <CardDescription>
            Connect your Stripe account to start accepting payments for your invoices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4">
            <StripeConnectButton 
              onStatusChange={handleConnectionStatusChange}
              redirectPath="/settings/payments"
            />
          </div>
        </CardContent>
      </Card>
      
      {stripeConnected && accountInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Connected Account</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Account Name</p>
                <p className="text-sm">{accountInfo.account_name}</p>
                
                <p className="text-sm font-medium mt-3">Email</p>
                <p className="text-sm">{accountInfo.account_email}</p>
                
                <p className="text-sm font-medium mt-3">Status</p>
                <p className="text-sm">{accountInfo.account_status}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium">Account ID</p>
                <p className="text-sm">{accountInfo.account_id}</p>
                
                <p className="text-sm font-medium mt-3">Connected</p>
                <p className="text-sm">{formatDate(accountInfo.created_at)}</p>
                
                <p className="text-sm font-medium mt-3">Default Account</p>
                <p className="text-sm">{accountInfo.default_account ? 'Yes' : 'No'}</p>
              </div>
            </div>
            
            <div className="mt-6 flex gap-3">
              <Button 
                variant="default" 
                onClick={() => window.open('https://dashboard.stripe.com', '_blank')}
                className="flex items-center"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Stripe Dashboard
              </Button>
              
              <Button 
                variant="destructive" 
                onClick={() => {
                  // Implement disconnect functionality here
                  alert('This would disconnect your Stripe account. Functionality not yet implemented.');
                }}
              >
                Disconnect Account
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
