
import React, { useEffect } from "react";
import { useQBOConnection } from "@/hooks/useQBOConnection";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { QBOConnectionDetails } from "./qbo/QBOConnectionDetails";
import { QBOConnectionActions } from "./qbo/QBOConnectionActions";
import { QBOConnectionStatus } from "./qbo/QBOConnectionStatus";
import { QBOSyncInformation } from "./qbo/QBOSyncInformation";
import { QBONoConnectionInfo } from "./qbo/QBONoConnectionInfo";
import { QBODebugInfo } from "./qbo/QBODebugInfo";
import { QBODiagnosticInfo } from "./qbo/QBODiagnosticInfo";
import { QBOErrorBoundary } from "@/components/error/QBOErrorBoundary";
import { useToast } from "@/components/ui/use-toast";

export function QBOSettings() {
  const { connection, isLoading, error, connectToQBO, disconnectFromQBO, testConnection } = useQBOConnection();
  const { toast } = useToast();
  
  // Listen for messages from popup window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify origin is trusted
      if (event.origin !== window.location.origin) {
        return;
      }
      
      // Handle QBO auth success message from popup
      if (event.data?.type === 'QBO_AUTH_SUCCESS') {
        // Force refresh connection data
        window.location.reload();
        
        toast({
          title: "Connection Successful",
          description: `Connected to ${event.data.companyName || 'QuickBooks Online'}`,
        });
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    return () => window.removeEventListener('message', handleMessage);
  }, [toast]);
  
  // Check if we're in development/sandbox mode
  const isSandboxMode = window.location.hostname === 'localhost' || 
                       window.location.hostname.includes('127.0.0.1') ||
                       window.location.hostname.includes('.vercel.app') ||
                       window.location.hostname.includes('.lovableproject.com');
  
  // Modified connectToQBO to return a Promise<boolean>
  const handleConnectToQBO = async (): Promise<boolean> => {
    return await connectToQBO();
  };
  
  return (
    <QBOErrorBoundary>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">QuickBooks Online Integration</CardTitle>
          <CardDescription>
            Connect your QuickBooks Online account to sync financial data from CNSTRCT
            {isSandboxMode && (
              <span className="block mt-2 text-amber-500 font-medium">
                Development Mode: Using QuickBooks Sandbox
              </span>
            )}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <QBODebugInfo />
          <QBOConnectionStatus error={error} />
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : connection ? (
            <>
              <QBOConnectionDetails 
                connection={connection} 
                isSandboxMode={isSandboxMode} 
              />
              <QBOSyncInformation />
              <QBODiagnosticInfo />
            </>
          ) : (
            <>
              <QBONoConnectionInfo isSandboxMode={isSandboxMode} />
              <QBODiagnosticInfo />
            </>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-end">
          {!isLoading && (
            <QBOConnectionActions 
              connection={connection}
              connectToQBO={handleConnectToQBO}
              disconnectFromQBO={disconnectFromQBO}
              testConnection={testConnection}
              isSandboxMode={isSandboxMode}
            />
          )}
        </CardFooter>
      </Card>
    </QBOErrorBoundary>
  );
}
