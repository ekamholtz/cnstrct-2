
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CreditCard, Link as LinkIcon } from 'lucide-react';
import { CreatePaymentLink } from './CreatePaymentLink';
import { PaymentLinkDisplay } from './PaymentLinkDisplay';
import { StripeConnectSettings } from './StripeConnectSettings';

export function PaymentSettings() {
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('connect');

  const handleLinkCreated = (link: string) => {
    setPaymentLink(link);
  };

  const handleReset = () => {
    setPaymentLink(null);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Payment Settings</h2>
          <p className="text-muted-foreground">
            Configure your payment processing and create payment links.
          </p>
        </div>
      </div>

      <Tabs defaultValue="connect" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="connect">
            <CreditCard className="h-4 w-4 mr-2" />
            Stripe Connect
          </TabsTrigger>
          <TabsTrigger value="links">
            <LinkIcon className="h-4 w-4 mr-2" />
            Payment Links
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="connect" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stripe Connect Integration</CardTitle>
              <CardDescription>
                Connect your Stripe account to accept payments directly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StripeConnectSettings />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="links" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create Payment Links</CardTitle>
              <CardDescription>
                Generate links that you can send to customers to collect payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!paymentLink ? (
                <CreatePaymentLink onLinkCreated={handleLinkCreated} />
              ) : (
                <PaymentLinkDisplay link={paymentLink} onReset={handleReset} />
              )}
            </CardContent>
            <CardFooter>
              <Alert variant="warning" className="bg-yellow-50 border-yellow-100 text-yellow-800 w-full">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertTitle className="text-yellow-800">Test Mode</AlertTitle>
                <AlertDescription className="text-yellow-700">
                  This is running in Stripe test mode. No real payments will be processed.
                </AlertDescription>
              </Alert>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
