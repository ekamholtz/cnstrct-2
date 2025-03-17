
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const StripeOnboardingComplete = () => {
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  useEffect(() => {
    // Simulate a loading delay for better UX
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleGoToPaymentSettings = () => {
    navigate('/settings/payments');
  };
  
  const handleCreatePaymentLink = () => {
    navigate('/stripe/create-payment');
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-16 px-4 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <h2 className="text-2xl font-bold text-center mb-2">Finalizing Your Stripe Setup</h2>
        <p className="text-gray-600 text-center max-w-md">
          Just a moment while we complete the integration with your Stripe account...
        </p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-16 px-4">
      <Card className="max-w-lg mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto bg-green-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Stripe Account Connected!</CardTitle>
          <CardDescription>
            Your Stripe account has been successfully connected to CNSTRCT Network
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            <p>
              You can now accept payments from your customers directly to your bank account. 
              Your payment information is securely stored and managed by Stripe.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-md">
              <h4 className="font-medium mb-2">What's Next?</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Create a payment link to share with your customers</li>
                <li>Set up your payment preferences</li>
                <li>Manage your Stripe account settings</li>
              </ul>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col sm:flex-row gap-3">
          <Button onClick={handleGoToPaymentSettings} variant="outline" className="w-full sm:w-auto">
            Payment Settings
          </Button>
          <Button onClick={handleCreatePaymentLink} className="w-full sm:w-auto">
            Create Payment Link
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default StripeOnboardingComplete;
