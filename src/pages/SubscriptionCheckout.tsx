
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStripeCheckout } from '@/hooks/useStripeCheckout';
import { CheckoutCard } from '@/components/subscription/CheckoutCard';
import { LoadingState } from '@/components/subscription/LoadingState';
import { ErrorState } from '@/components/subscription/ErrorState';

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
  
  // Determine the content to show based on state
  const renderContent = () => {
    if (isLoading) {
      return <LoadingState />;
    }
    
    if (checkoutError) {
      return (
        <ErrorState 
          errorMessage={checkoutError} 
          onRetry={() => redirectToCheckout()}
        />
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
