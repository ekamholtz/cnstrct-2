
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function StripeCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error_param = searchParams.get('error');
  
  useEffect(() => {
    const handleCallback = async () => {
      if (error_param) {
        setError(`Stripe authorization error: ${error_param}`);
        setProcessing(false);
        return;
      }
      
      if (!code || !state) {
        setError('Missing authorization code or state parameter');
        setProcessing(false);
        return;
      }
      
      try {
        // Handle the Stripe Connect OAuth callback
        const response = await fetch('/api/stripe/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code, state }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to process Stripe authorization');
        }
        
        // Success - redirect to the appropriate page
        toast({
          title: 'Success',
          description: 'Your Stripe account has been connected successfully',
        });
        
        // Redirect to payment settings with success parameter
        navigate('/settings/payments?success=true');
      } catch (err: any) {
        console.error('Error processing Stripe callback:', err);
        setError(err.message || 'An unexpected error occurred');
        setProcessing(false);
      }
    };
    
    handleCallback();
  }, [code, state, error_param, toast, navigate]);
  
  const handleRetry = () => {
    navigate('/settings/payments');
  };
  
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Connection Error</CardTitle>
            <CardDescription>
              There was a problem connecting your Stripe account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-red-500">{error}</p>
            <Button onClick={handleRetry} className="w-full">
              Return to Payment Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Processing</CardTitle>
          <CardDescription>
            Finalizing your Stripe account connection
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-center text-muted-foreground">
            Please wait while we configure your payment settings...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
