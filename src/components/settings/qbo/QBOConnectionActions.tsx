import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { QboService } from "@/integrations/services/QboService";

interface QBOConnection {
  id: string;
  company_id: string;
  company_name: string;
  access_token: string;
  refresh_token: string;
  created_at: string;
  updated_at: string;
}

interface QBOConnectionActionsProps {
  connection: QBOConnection | null;
  connectToQBO: () => void;
  disconnectFromQBO: () => Promise<boolean>;
  isSandboxMode: boolean;
}

export function QBOConnectionActions({ 
  connection, 
  connectToQBO, 
  disconnectFromQBO,
  isSandboxMode
}: QBOConnectionActionsProps) {
  const [isTesting, setIsTesting] = useState(false);
  const { toast } = useToast();
  
  const handleDisconnect = async () => {
    if (window.confirm("Are you sure you want to disconnect from QuickBooks Online? This will stop all syncing.")) {
      await disconnectFromQBO();
    }
  };
  
  const testConnection = async () => {
    if (!connection) return;
    
    setIsTesting(true);
    
    try {
      // Create a QboService instance using the new unified service
      const qboService = new QboService({
        clientId: process.env.QBO_CLIENT_ID || 'AB6pN0pnXfsEqiCl1S03SYSdoRISCVD2ZQDxDgR4yYvbDdEx4j',
        clientSecret: process.env.QBO_CLIENT_SECRET || '4zjveAX4tFhuxWx1sfgN3bE4zRVUquuFun3YqVau'
      });
      
      // Use the testConnection method from the new QboService
      const { success, error } = await qboService.testConnection(
        connection.access_token,
        connection.company_id
      );
      
      if (success) {
        toast({ 
          title: "Connection Successful", 
          description: "Connection to QuickBooks API is working properly.",
          variant: "default"
        });
      } else {
        toast({ 
          title: "Connection Failed", 
          description: `Connection test failed: ${error?.message || 'Unknown error'}`,
          variant: "destructive"
        });
      }
    } catch (err: any) {
      console.error("QBO Connection test failed:", err);
      
      // Extract more detailed error information
      const errorResponse = err.response?.data;
      const errorMessage = errorResponse?.Fault?.Error?.[0]?.Message || 
                         errorResponse?.message ||
                         err.message ||
                         'Unknown error occurred';
                         
      const detailedError = errorResponse?.Fault?.Error?.[0]?.Detail || '';
      
      toast({ 
        title: "Connection Failed", 
        description: `Connection test failed: ${errorMessage}${detailedError ? ` (${detailedError})` : ''}`,
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };
  
  return (
    connection ? (
      <div className="space-x-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={testConnection}
          disabled={isTesting}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isTesting ? 'animate-spin' : ''}`} />
          {isTesting ? "Testing..." : "Test Connection"}
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => window.open(isSandboxMode ? 
            "https://sandbox.qbo.intuit.com/app/homepage" : 
            "https://qbo.intuit.com", 
            "_blank")}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Open QuickBooks
        </Button>
        <Button variant="destructive" size="sm" onClick={handleDisconnect}>
          Disconnect
        </Button>
      </div>
    ) : (
      <div className="flex flex-col w-full items-end space-y-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={connectToQBO}>
                Connect to QuickBooks Online
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs text-xs">
                If you experience issues connecting, verify that your app is properly registered in the Intuit Developer Portal.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    )
  );
}
