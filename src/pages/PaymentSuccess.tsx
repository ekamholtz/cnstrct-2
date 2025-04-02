import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const invoiceId = searchParams.get('invoice_id');
  const navigate = useNavigate();
  const { user } = useAuth();
  const [canRedirect, setCanRedirect] = useState(false);
  
  useEffect(() => {
    // Check if user is authenticated after a slight delay to allow auth to initialize
    const timer = setTimeout(() => {
      setCanRedirect(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [user]);
  
  const handleReturnToInvoices = () => {
    // If we have a specific invoice ID, go to that invoice
    if (invoiceId) {
      navigate(`/invoices/${invoiceId}`);
    } else {
      // Otherwise just go to the invoices list
      navigate('/invoices');
    }
  };
  
  const handleReturnToDashboard = () => {
    navigate('/');
  };
  
  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Payment Successful!</CardTitle>
          <CardDescription>
            Your payment has been processed successfully.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="text-center">
          <p className="text-muted-foreground">
            Thank you for your payment. A receipt has been sent to your email address.
          </p>
          
          {sessionId && (
            <div className="mt-4 p-3 bg-muted rounded-md">
              <p className="text-xs text-muted-foreground">
                Session ID: {sessionId}
              </p>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-2">
          {canRedirect && user ? (
            <Button 
              className="w-full" 
              onClick={handleReturnToInvoices}
              variant="default"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Invoices
            </Button>
          ) : (
            <Button 
              className="w-full" 
              onClick={handleReturnToDashboard}
              variant="default"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Dashboard
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
