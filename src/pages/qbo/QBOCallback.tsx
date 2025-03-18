import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthorizationService } from "@/integrations/qbo/services/auth/AuthorizationService";
import { QBOConfig } from "@/integrations/qbo/config/qboConfig";
import { AlertCircle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function QBOCallback() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [errorDetails, setErrorDetails] = useState<string>("");
  const [companyName, setCompanyName] = useState<string>("");
  const navigate = useNavigate();
  const location = useLocation();
  
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
        
        if (error) {
          console.error("OAuth error:", error, errorDescription);
          setStatus("error");
          setErrorMessage(`Authorization error: ${error}`);
          if (errorDescription) {
            setErrorDetails(errorDescription);
          }
          return;
        }
        
        if (!code || !state) {
          console.error("Missing code or state");
          setStatus("error");
          setErrorMessage("Missing authorization code or state parameter");
          return;
        }
        
        // Get the stored user ID from localStorage (set during auth initiation)
        const userId = localStorage.getItem('qbo_auth_user_id');
        console.log("Retrieved user ID from localStorage:", userId);
        
        // Use the AuthorizationService for more flexible handling
        const authService = new AuthorizationService();
        const result = await authService.handleCallback(code, state, userId);
        
        if (!result.success) {
          console.error("Callback handling error:", result.error);
          setStatus("error");
          setErrorMessage(result.error || "Failed to complete QuickBooks Online connection");
          return;
        }
        
        // Successfully connected
        setStatus("success");
        setCompanyName(result.companyName || "your company");
        
        // Clear the stored user ID
        localStorage.removeItem('qbo_auth_user_id');
      } catch (error) {
        console.error("Error in QBO callback:", error);
        setStatus("error");
        setErrorMessage(error instanceof Error ? error.message : "An unknown error occurred");
      }
    }
    
    handleCallback();
  }, [location]);
  
  const handleNavigate = () => {
    navigate("/dashboard");
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
            </div>
          )}
          
          {status === "error" && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Connection Failed</AlertTitle>
              <AlertDescription>
                <p>{errorMessage}</p>
                {errorDetails && <p className="mt-2 text-sm">{errorDetails}</p>}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        
        <CardFooter>
          <Button onClick={handleNavigate} className="w-full">
            {status === "success" ? "Go to Dashboard" : "Back to Dashboard"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
