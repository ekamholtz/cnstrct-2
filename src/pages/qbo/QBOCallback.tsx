import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthorizationService } from "@/integrations/qbo/services/auth/AuthorizationService";
import { QBOConfig } from "@/integrations/qbo/config/qboConfig";
import { AlertCircle, CheckCircle, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";

export default function QBOCallback() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [errorDetails, setErrorDetails] = useState<string>("");
  const [companyName, setCompanyName] = useState<string>("");
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  useEffect(() => {
    async function handleCallback() {
      try {
        // Use the singleton instance to ensure consistent configuration
        const qboConfig = QBOConfig.getInstance();
        console.log("QBO Config in callback:", {
          clientId: qboConfig.clientId,
          redirectUri: qboConfig.redirectUri,
          environment: qboConfig.isProduction ? "Production" : "Sandbox"
        });
        
        const queryParams = new URLSearchParams(location.search);
        const code = queryParams.get("code");
        const state = queryParams.get("state");
        const error = queryParams.get("error");
        const errorDescription = queryParams.get("error_description");
        const realmId = queryParams.get("realmId");
        
        // Check if Intuit returned an error
        if (error) {
          console.error("OAuth error from Intuit:", error, errorDescription);
          setStatus("error");
          setErrorMessage(`QuickBooks OAuth error: ${error}`);
          if (errorDescription) {
            setErrorDetails(decodeURIComponent(errorDescription));
          }
          
          // Also show toast for error
          toast({
            variant: "destructive",
            title: "QuickBooks Connection Failed",
            description: errorDescription || error
          });
          
          return;
        }
        
        if (!code || !state) {
          console.error("Missing code or state in QBO callback", { code, state });
          setStatus("error");
          setErrorMessage("Missing required OAuth parameters");
          setErrorDetails("The authorization code or state parameter is missing from the callback URL. This could indicate a problem with the QuickBooks authorization process.");
          return;
        }
        
        // Get the stored user ID from localStorage (set during auth initiation)
        const userId = localStorage.getItem('qbo_auth_user_id');
        console.log("Retrieved user ID from localStorage:", userId);
        
        // Use the AuthorizationService for more flexible handling
        const authService = new AuthorizationService();
        const result = await authService.handleCallback(code, state, userId, realmId);
        
        if (!result.success) {
          console.error("Callback handling error:", result.error);
          setStatus("error");
          setErrorMessage(result.error || "Failed to complete QuickBooks Online connection");
          setErrorDetails("There was a problem processing the QuickBooks authorization. Please try again or contact support if the issue persists.");
          
          // Also show toast for error
          toast({
            variant: "destructive",
            title: "QuickBooks Connection Failed",
            description: result.error || "Failed to complete connection"
          });
          
          return;
        }
        
        // Successfully connected
        setStatus("success");
        setCompanyName(result.companyName || "your company");
        
        // Show toast for success
        toast({
          title: "QuickBooks Connected Successfully",
          description: `Connected to ${result.companyName || "your company"}`
        });
        
        // Clear the stored user ID
        localStorage.removeItem('qbo_auth_user_id');
        
        // Notify the opener window about success
        if (window.opener) {
          try {
            window.opener.postMessage({
              type: 'QBO_AUTH_SUCCESS',
              companyId: realmId,
              companyName: result.companyName
            }, window.location.origin);
            
            // Close this window after 2 seconds to allow the user to see the success message
            setTimeout(() => {
              window.close();
            }, 2000);
          } catch (error) {
            console.error("Error posting message to opener:", error);
            // Fall back to navigation if messaging fails
            setTimeout(() => {
              navigate("/integrations");
            }, 2000);
          }
        } else {
          // If there's no opener (direct navigation), redirect after 2 seconds
          setTimeout(() => {
            navigate("/integrations");
          }, 2000);
        }
      } catch (error: any) {
        console.error("Error in QBO callback:", error);
        setStatus("error");
        setErrorMessage(error instanceof Error ? error.message : "An unknown error occurred");
        setErrorDetails("There was an unexpected error during the QuickBooks connection process. Please try again or contact support.");
        
        // Also show toast for error
        toast({
          variant: "destructive",
          title: "QuickBooks Connection Error",
          description: error instanceof Error ? error.message : "An unexpected error occurred"
        });
      }
    }
    
    handleCallback();
  }, [location, navigate, toast]);
  
  const handleNavigate = () => {
    // If this is a popup window, try to close it
    if (window.opener) {
      window.close();
    } else {
      // Otherwise navigate back to integrations page
      navigate("/integrations");
    }
  };
  
  return (
    <div className="container mx-auto max-w-lg pt-16 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">QuickBooks Online Connection</CardTitle>
          <CardDescription>
            {status === "loading" ? "Establishing connection..." : 
             status === "success" ? "Connection successful" : 
             "Connection error"}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {status === "loading" && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">Connecting to QuickBooks Online...</p>
            </div>
          )}
          
          {status === "success" && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="h-6 w-6" />
                <p className="font-medium">Successfully connected to {companyName}</p>
              </div>
              <p>You can now use QuickBooks Online features in your account.</p>
              <p className="text-sm text-muted-foreground">This window will close automatically...</p>
            </div>
          )}
          
          {status === "error" && (
            <>
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Connection Failed</AlertTitle>
                <AlertDescription>
                  <p>{errorMessage}</p>
                </AlertDescription>
              </Alert>
              
              {errorDetails && (
                <div className="mt-4 p-4 bg-muted rounded-md">
                  <h3 className="text-sm font-medium mb-2">Error Details</h3>
                  <p className="text-sm text-muted-foreground">{errorDetails}</p>
                </div>
              )}
              
              <div className="mt-6 p-4 bg-muted/50 rounded-md border border-border">
                <h3 className="text-sm font-medium mb-2">Troubleshooting Steps</h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Make sure your QuickBooks Online account is active</li>
                  <li>Verify you have admin permissions for your QuickBooks company</li>
                  <li>Check that cookies are enabled in your browser</li>
                  <li>Try clearing your browser cache and cookies</li>
                </ul>
              </div>
            </>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button onClick={handleNavigate} className="w-full">
            {status === "loading" ? "Cancel" : 
             status === "success" ? "Close Window" : 
             "Return to Integrations"}
          </Button>
          
          {status === "error" && (
            <Button 
              variant="outline" 
              className="ml-2"
              onClick={() => window.open("https://developer.intuit.com/app/developer/qbo/docs/develop/authentication-and-authorization", "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Help
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
