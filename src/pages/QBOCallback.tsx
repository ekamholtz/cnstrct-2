
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { useToast } from '@/components/ui/use-toast';

export function QBOCallback() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('Processing QBO authorization...');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Extract parameters from URL
  const success = searchParams.get('success') === 'true';
  const errorMessage = searchParams.get('message');
  const companyName = searchParams.get('companyName');

  useEffect(() => {
    // Process the callback parameters
    if (errorMessage) {
      setError(decodeURIComponent(errorMessage));
      setStatus('Authorization failed');
      setIsProcessing(false);
      
      toast({
        title: "QBO Connection Failed",
        description: decodeURIComponent(errorMessage),
        variant: "destructive"
      });
    } else if (success) {
      setStatus(`Connected to ${companyName || 'QuickBooks Online'}! Redirecting...`);
      
      toast({
        title: "Connection Successful",
        description: `Connected to ${companyName || 'QuickBooks Online'}`,
      });
      
      // Set a timeout for user to see success message before redirecting
      setTimeout(() => {
        // If this was opened in a popup, try to close it and notify the opener
        if (window.opener) {
          try {
            // Notify the opener window about success
            window.opener.postMessage({
              type: 'QBO_AUTH_SUCCESS',
              companyName
            }, window.location.origin);
            
            // Close the popup
            window.close();
          } catch (err) {
            console.error("Could not communicate with opener window:", err);
          }
        }
        
        // If we're still here (not a popup or couldn't close), redirect
        navigate('/settings');
      }, 2000);
    } else {
      setError('Missing callback parameters');
      setStatus('Authorization failed');
      setIsProcessing(false);
    }
  }, [success, errorMessage, companyName, navigate, toast]);

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6">
          <h1 className="text-2xl font-bold mb-4">QBO Authentication</h1>
          
          <div className="mt-4">
            {isProcessing ? (
              <div className="flex items-center">
                <Loader2 className="mr-3 h-5 w-5 animate-spin text-primary" />
                <p>{status}</p>
              </div>
            ) : error ? (
              <div className="p-4 border border-red-200 bg-red-50 rounded-md">
                <div className="flex items-center text-red-700 mb-2">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  <h3 className="font-medium">Authentication Error</h3>
                </div>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            ) : (
              <div className="p-4 border border-green-200 bg-green-50 rounded-md">
                <div className="flex items-center text-green-700 mb-2">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <h3 className="font-medium">Authentication Successful</h3>
                </div>
                <p className="text-green-600 text-sm">{status}</p>
              </div>
            )}
          </div>
        </CardContent>
        
        {!isProcessing && (
          <CardFooter>
            <Button 
              onClick={() => navigate('/settings')}
              variant="default"
              className="w-full"
            >
              Return to Settings
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
