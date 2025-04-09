
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStripeCheckout } from '@/hooks/useStripeCheckout';
import { CheckoutCard } from '@/components/subscription/CheckoutCard';
import { LoadingState } from '@/components/subscription/LoadingState';
import { ErrorState } from '@/components/subscription/ErrorState';
import { Button } from '@/components/ui/button';

export default function SubscriptionCheckout() {
  const navigate = useNavigate();
  const { 
    isLoading, 
    checkoutError, 
    redirectToCheckout 
  } = useStripeCheckout();
  
  useEffect(() => {
    if (!isLoading && !checkoutError) {
      // Automatically redirect to Stripe checkout when ready
      redirectToCheckout();
    }
  }, [isLoading, checkoutError, redirectToCheckout]);
  
  const handleGoBack = () => {
    navigate('/subscription-selection');
  };
  
  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };
  
  // Determine the content to show based on state
  const renderContent = () => {
    if (isLoading) {
      return <LoadingState />;
    }
    
    if (checkoutError) {
      return (
        <div className="space-y-6">
          <ErrorState 
            errorMessage={checkoutError} 
            onRetry={() => redirectToCheckout()}
          />
          
          <div className="flex flex-col space-y-3 pt-4">
            <Button variant="outline" onClick={handleGoBack}>
              Return to Subscription Selection
            </Button>
            
            <Button variant="secondary" onClick={handleGoToDashboard}>
              Continue to Dashboard
            </Button>
          </div>
        </div>
      );
    }
    
    return <LoadingState message="Redirecting to secure payment page..." />;
  };

  return (
    <div className="container max-w-md mx-auto py-12 px-4">
      <CheckoutCard
        title="Subscription Setup"
        description={isLoading ? "Setting up your subscription..." : "Redirecting to payment..."}
      >
        {renderContent()}
      </CheckoutCard>
    </div>
  );
}
