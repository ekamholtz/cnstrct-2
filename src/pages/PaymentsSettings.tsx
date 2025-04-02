
import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PaymentSettings } from "@/components/stripe/PaymentSettings";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { useSearchParams } from "react-router-dom";

export default function PaymentsSettings() {
  const [searchParams] = useSearchParams();
  const refresh = searchParams.get('refresh') === 'true';
  const success = searchParams.get('success') === 'true';

  return (
    <DashboardLayout>
      <div className="container mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-6">Payment Settings</h1>
        
        {refresh && (
          <Alert className="mb-6 bg-amber-50 border-amber-200">
            <InfoIcon className="h-4 w-4 text-amber-600" />
            <AlertTitle>Onboarding Interrupted</AlertTitle>
            <AlertDescription>
              Your onboarding process was interrupted. Please continue to complete the setup process.
            </AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <InfoIcon className="h-4 w-4 text-green-600" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>
              Your Stripe account has been successfully connected.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-6">
          <PaymentSettings />
          
          <div className="bg-muted/30 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-3">About Stripe Connect</h2>
            <p className="text-muted-foreground">
              Stripe Connect allows you to accept payments directly from your clients through our platform.
              When you connect your Stripe account, we handle all the payment processing for you, making 
              it easy to get paid for your work. We charge a small platform fee (2.5%) for each transaction,
              in addition to the standard Stripe processing fees.
            </p>
            
            <h3 className="font-medium mt-4">Benefits:</h3>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Accept credit card payments directly from invoices</li>
              <li>Create payment links to share with clients</li>
              <li>Automatic reconciliation with your invoices</li>
              <li>Funds go directly to your bank account</li>
              <li>Full integration with our invoicing system</li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
