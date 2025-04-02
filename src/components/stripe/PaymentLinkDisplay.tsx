
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LoaderCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface PaymentLinkDisplayProps {
  paymentLinkId?: string;
  paymentLinkUrl?: string;
  checkoutSessionId?: string;
  onComplete?: () => void;
  onCancel?: () => void;
  autoRedirect?: boolean;
  successUrl?: string;
  cancelUrl?: string;
}

export function PaymentLinkDisplay({
  paymentLinkId,
  paymentLinkUrl,
  checkoutSessionId,
  onComplete,
  onCancel,
  autoRedirect = true,
  successUrl = '/dashboard',
  cancelUrl = '/dashboard'
}: PaymentLinkDisplayProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [url, setUrl] = useState<string | null>(paymentLinkUrl || null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // When component mounts, check for checkout session query params
  useEffect(() => {
    // Parse query parameters for checkout status
    const queryParams = new URLSearchParams(window.location.search);
    const sessionId = queryParams.get('session_id');
    const success = queryParams.get('success') === 'true';
    const canceled = queryParams.get('canceled') === 'true';

    // Log checkout parameters for debugging
    if (sessionId || success || canceled) {
      console.log('Detected Stripe redirect with params:', { 
        sessionId, 
        success, 
        canceled,
        referrer: document.referrer
      });
    }

    // Handle success case
    if (sessionId && success) {
      toast({
        title: "Payment successful!",
        description: "Thank you for your payment. Your transaction was successful.",
      });
      
      // Clear the URL parameters to prevent duplicate handling
      const clearedUrl = window.location.pathname;
      window.history.replaceState({}, document.title, clearedUrl);
      
      // Call the completion callback if provided
      if (onComplete) {
        onComplete();
      }
      
      return;
    }
    
    // Handle canceled case
    if (canceled) {
      toast({
        variant: "destructive",
        title: "Payment canceled",
        description: "Your payment was canceled. No charges were made.",
      });
      
      // Clear the URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Call the cancellation callback if provided
      if (onCancel) {
        onCancel();
      }
      
      return;
    }

    // Auto-redirect to Stripe if URL is already provided and autoRedirect is enabled
    if (paymentLinkUrl && autoRedirect) {
      window.location.href = paymentLinkUrl;
    }
  }, [paymentLinkUrl, onComplete, onCancel, autoRedirect, toast]);

  // Function to navigate to Stripe Checkout
  const handleCheckout = () => {
    if (url) {
      setIsLoading(true);
      // Append success/cancel URLs if not already in the URL
      let checkoutUrl = url;
      if (!checkoutUrl.includes('success_url')) {
        const separator = checkoutUrl.includes('?') ? '&' : '?';
        checkoutUrl += `${separator}success_url=${encodeURIComponent(window.location.origin + successUrl)}`;
      }
      if (!checkoutUrl.includes('cancel_url')) {
        const separator = checkoutUrl.includes('?') ? '&' : '?';
        checkoutUrl += `${separator}cancel_url=${encodeURIComponent(window.location.origin + cancelUrl)}`;
      }
      
      console.log('Redirecting to Stripe checkout:', checkoutUrl);
      window.location.href = checkoutUrl;
    } else {
      console.error('No payment link URL provided');
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not initialize payment. Please try again later.",
      });
    }
  };

  // If no URL is provided, render nothing
  if (!url && !isLoading) {
    return null;
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Complete Your Payment</CardTitle>
        <CardDescription>
          You'll be redirected to Stripe to securely complete your payment.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <LoaderCircle className="h-8 w-8 animate-spin" />
            <span className="ml-2">Redirecting to payment gateway...</span>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Click the button below to proceed to our secure payment processor.
          </p>
        )}
      </CardContent>
      <CardFooter>
        {!isLoading && (
          <Button 
            onClick={handleCheckout} 
            className="w-full"
            disabled={isLoading}
          >
            Proceed to Payment
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
