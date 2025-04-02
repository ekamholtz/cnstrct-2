
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const [processing, setProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        
        if (!code) {
          setError("Missing authorization code");
          setProcessing(false);
          return;
        }
        
        // Normally you would handle the OAuth callback here
        console.log("Processing Stripe callback with code:", code, "and state:", state);
        
        // For this example, we'll simulate processing
        setTimeout(() => {
          const success = true; // Assume success for demo
          
          if (success) {
            navigate('/settings/payments?success=true');
          } else {
            setError("Failed to complete authorization");
            setProcessing(false);
          }
        }, 2000);
        
      } catch (err: any) {
        console.error("Error handling payment callback:", err);
        setError(err.message || "An unknown error occurred");
        setProcessing(false);
      }
    };
    
    handleCallback();
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Authorization Error</h1>
          <p className="text-muted-foreground">{error}</p>
          <button 
            onClick={() => navigate('/settings/payments')}
            className="mt-6 w-full bg-primary text-white py-2 px-4 rounded hover:bg-primary/90"
          >
            Return to Payment Settings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Processing Authorization</h1>
        <div className="flex items-center">
          <div className="animate-spin mr-3 h-5 w-5 border-2 border-t-blue-500 rounded-full"></div>
          <p>Completing Stripe Connect setup...</p>
        </div>
      </div>
    </div>
  );
}
