import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthorizationService } from "@/integrations/qbo/services/auth/AuthorizationService";
import { AlertCircle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { QBOSessionHelper } from "@/integrations/qbo/utils/qboSessionHelper";
import { QBOUtils } from "@/integrations/qbo/utils/qboUtils";

export default function QBOCallback() {
  const [status, setStatus] = useState<"loading" | "processing" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [companyName, setCompanyName] = useState<string>("");
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    async function handleOAuthCallback() {
      try {
        setStatus("processing");
        
        // IMPORTANT: First attempt to restore the auth session before
        // doing anything else to prevent being redirected to login
        console.log("Attempting to restore auth session from backup...");
        const sessionRestored = await QBOSessionHelper.restoreAuthSession();
        console.log("Auth session restored:", sessionRestored);
        
        // Wait a moment for Supabase client to recognize the restored session
        if (sessionRestored) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        const queryParams = new URLSearchParams(location.search);
        const code = queryParams.get("code");
        const state = queryParams.get("state");
        const error = queryParams.get("error");
        const realmId = queryParams.get("realmId");  // Extract realmId from URL
        
        if (error) {
          console.error("OAuth error:", error);
          setStatus("error");
          setErrorMessage(`Authorization error: ${error}`);
          
          // Clean up even on error
          QBOUtils.clearOAuthState();
          return;
        }
        
        if (!code || !state) {
          console.error("Missing code or state");
          setStatus("error");
          setErrorMessage("Missing authorization code or state parameter");
          
          // Clean up
          QBOUtils.clearOAuthState();
          return;
        }
        
        // Log the realmId for debugging
        console.log("RealmId from URL params:", realmId);
        
        // Get the stored user ID from localStorage (set during auth initiation)
        let userId = QBOSessionHelper.getStoredUserId();
        console.log("Retrieved user ID from localStorage:", userId);
        
        // If we don't have a user ID but session was restored, try to get it from Supabase
        if (!userId && sessionRestored) {
          try {
            const { data } = await supabase.auth.getUser();
            if (data?.user) {
              userId = data.user.id;
              console.log("Retrieved user ID from Supabase session:", userId);
            }
          } catch (error) {
            console.error("Error getting user from Supabase session:", error);
          }
        }
        
        if (!userId) {
          // Try to get the current user from Supabase
          const { data } = await supabase.auth.getUser();
          
          if (data?.user) {
            console.log("Found authenticated user from session:", data.user.id);
            userId = data.user.id;
          } else {
            console.error("No authenticated user found in session");
            setStatus("error");
            setErrorMessage("Authentication required. Please log in again.");
            return;
          }
        }
        
        // Use the AuthorizationService for more flexible handling
        const authService = new AuthorizationService();
        
        // Create a custom payload for better context
        const callbackPayload = {
          code,
          state,
          userId,
          realmId
        };
        
        console.log("Passing callback payload:", {
          code: "[REDACTED]",
          state: "[REDACTED]",
          userId,
          realmId
        });
        
        const result = await authService.handleCallback(
          code, 
          state, 
          userId, 
          realmId // Pass realmId to the authorization service
        );
        
        if (!result.success) {
          console.error("Callback handling error:", result.error);
          setStatus("error");
          setErrorMessage(result.error || "Failed to complete QuickBooks Online connection");
          return;
        }
        
        // Successfully connected
        setStatus("success");
        setCompanyName(result.companyName || "your company");
      } catch (error) {
        console.error("Error in QBO callback:", error);
        setStatus("error");
        setErrorMessage(error instanceof Error ? error.message : "An unknown error occurred");
      }
    }
    
    handleOAuthCallback();
  }, [location]);
  
  const handleNavigate = () => {
    // Clear the session data after successful navigation
    QBOSessionHelper.clearSessionData();
    
    // Navigate to settings instead of dashboard to see the QBO connection status
    navigate("/settings");
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
                <span className="font-medium">Successfully connected to QuickBooks Online</span>
              </div>
              
              <Alert className="bg-green-50 border-green-200">
                <AlertTitle className="text-green-800">Connection established</AlertTitle>
                <AlertDescription className="text-green-700">
                  Your CNSTRCT account is now connected to {companyName} in QuickBooks Online. 
                  You can now sync financial data between the two platforms.
                </AlertDescription>
              </Alert>
            </div>
          )}
          
          {status === "error" && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Connection failed</AlertTitle>
                <AlertDescription>
                  {errorMessage || "Failed to connect to QuickBooks Online. Please try again."}
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-end">
          <Button onClick={handleNavigate}>
            {status === "success" ? "Go to Settings" : "Back to Settings"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
