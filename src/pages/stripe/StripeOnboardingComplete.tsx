
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle, Loader2 } from 'lucide-react';

const StripeOnboardingComplete = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const handleOnboardingComplete = async () => {
      try {
        setLoading(true);
        
        // Show success toast
        toast({
          title: 'Account Connected',
          description: 'Your Stripe account is now connected with CNSTRCT Network.',
          duration: 5000,
        });
        
        // Wait a moment before redirecting
        setTimeout(() => {
          navigate('/settings/payments?success=true');
        }, 3000);
      } catch (error: any) {
        console.error('Error handling onboarding completion:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'There was a problem completing your Stripe setup.',
          duration: 5000,
        });
        
        // Still redirect to payment settings
        setTimeout(() => {
          navigate('/settings/payments');
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    // If we have the user, process the onboarding completion
    if (user) {
      handleOnboardingComplete();
    } else {
      // If no user, redirect to login
      navigate('/login');
    }
  }, [navigate, toast, user]);

  return (
    <div className="container max-w-md mx-auto mt-20 px-4">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Stripe Setup {loading ? 'Processing' : 'Complete'}</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p>Processing your Stripe account setup...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <p>Your Stripe account has been successfully connected!</p>
              <p className="text-sm text-gray-500">Redirecting you to payment settings...</p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate('/settings/payments')}
          >
            Go to Payment Settings
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default StripeOnboardingComplete;
