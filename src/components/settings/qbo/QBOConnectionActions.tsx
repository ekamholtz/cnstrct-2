
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, LogOut, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";

interface DisplayQBOConnection {
  id: string;
  company_id: string;
  company_name: string;
  created_at: string;
  updated_at: string;
}

interface QBOConnectionActionsProps {
  connection: DisplayQBOConnection | null;
  connectToQBO: () => void;
  disconnectFromQBO: () => Promise<boolean>;
  isSandboxMode?: boolean;
}

export function QBOConnectionActions({ 
  connection, 
  connectToQBO, 
  disconnectFromQBO,
  isSandboxMode 
}: QBOConnectionActionsProps) {
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();
  
  const handleConnect = () => {
    // Reset error state
    setPopupBlocked(false);
    setIsConnecting(true);
    
    // Test if popups are blocked (often browsers block without triggering events)
    const testPopup = window.open('', '_blank', 'width=1,height=1');
    
    if (!testPopup || testPopup.closed || typeof testPopup.closed === 'undefined') {
      setPopupBlocked(true);
      setIsConnecting(false);
      testPopup?.close();
      
      toast({
        variant: "destructive",
        title: "Popup Blocked",
        description: "Please allow popups for this site to connect with QuickBooks."
      });
      
      return;
    }
    
    // Close the test popup and proceed with connection
    testPopup.close();
    
    try {
      // Listen for message from the popup window
      const messageHandler = (event: MessageEvent) => {
        // Only accept messages from our own domain
        if (event.origin !== window.location.origin) return;
        
        if (event.data?.type === 'QBO_AUTH_SUCCESS') {
          console.log("Received success message from QBO popup:", event.data);
          
          setIsConnecting(false);
          
          // Force refresh connection data
          window.location.reload();
          
          // Clean up the event listener
          window.removeEventListener('message', messageHandler);
        }
      };
      
      // Add the event listener before opening the popup
      window.addEventListener('message', messageHandler);
      
      // Set a timeout to clean up the event listener if the authentication takes too long
      setTimeout(() => {
        window.removeEventListener('message', messageHandler);
        setIsConnecting(false);
      }, 300000); // 5 minutes
      
      // Start the connection process
      connectToQBO();
      
    } catch (error) {
      console.error("Error in QBO connection flow:", error);
      setIsConnecting(false);
      
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: error instanceof Error ? error.message : "Failed to connect to QuickBooks"
      });
    }
  };
  
  const handleDisconnect = async () => {
    try {
      setIsConnecting(true);
      const success = await disconnectFromQBO();
      
      if (success) {
        toast({
          title: "Successfully Disconnected",
          description: "Your QuickBooks Online connection has been removed."
        });
      } else {
        toast({
          variant: "destructive",
          title: "Disconnect Failed",
          description: "There was a problem disconnecting from QuickBooks Online."
        });
      }
    } catch (error) {
      console.error("Error disconnecting from QBO:", error);
      toast({
        variant: "destructive",
        title: "Disconnect Error",
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
    } finally {
      setIsConnecting(false);
    }
  };
  
  return (
    <div className="space-y-4">
      {popupBlocked && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="ml-2">
            <div className="flex flex-col space-y-2">
              <p>Popup windows appear to be blocked by your browser. Please allow popups for this site to connect with QuickBooks.</p>
              <ol className="list-decimal list-inside text-sm">
                <li>Look for a popup blocker icon in your browser address bar</li>
                <li>Click it and select "Always allow popups from this site"</li>
                <li>Then try connecting again</li>
              </ol>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      {connection ? (
        <Button 
          variant="outline" 
          onClick={handleDisconnect}
          disabled={isConnecting}
          className="text-red-600 border-red-200 hover:bg-red-50"
        >
          {isConnecting ? (
            <>
              <div className="animate-spin h-4 w-4 mr-2 border-2 border-red-600 border-t-transparent rounded-full"></div>
              Disconnecting...
            </>
          ) : (
            <>
              <LogOut className="mr-2 h-4 w-4" />
              Disconnect from QuickBooks
            </>
          )}
        </Button>
      ) : (
        <Button 
          onClick={handleConnect} 
          disabled={isConnecting}
        >
          {isConnecting ? (
            <>
              <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
              Connecting...
            </>
          ) : (
            <>
              <ArrowUpRight className="mr-2 h-4 w-4" />
              Connect to QuickBooks {isSandboxMode ? "Sandbox" : ""}
            </>
          )}
        </Button>
      )}
    </div>
  );
}
