
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle } from 'lucide-react';

export function PaymentSettingsTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Settings</CardTitle>
        <CardDescription>Configure payment preferences and options</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Platform Fee</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-2">
                The platform fee is automatically calculated and applied to all payments.
              </p>
              <p className="text-lg font-bold">
                {import.meta.env.VITE_STRIPE_PLATFORM_FEE_PERCENTAGE || '2.5'}%
              </p>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Payment Methods</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-2">
                The following payment methods are enabled for your account:
              </p>
              <div className="mt-2 space-y-1">
                <p className="text-sm flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Credit and Debit Cards
                </p>
                <p className="text-sm flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  ACH Direct Debit (US only)
                </p>
                <p className="text-sm flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Bank Transfers
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Alert variant="warning" className="mt-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Additional Settings</AlertTitle>
          <AlertDescription>
            Additional payment settings are managed directly through your Stripe Dashboard.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
