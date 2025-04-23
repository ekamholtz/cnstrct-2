
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, LogOut, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  
  const handleConnect = () => {
    // Test if popups are blocked (often browsers block without triggering events)
    const testPopup = window.open('', '_blank', 'width=1,height=1');
    
    if (!testPopup || testPopup.closed || typeof testPopup.closed === 'undefined') {
      setPopupBlocked(true);
      testPopup?.close();
      return;
    }
    
    // Close the test popup and proceed with connection
    testPopup.close();
    setPopupBlocked(false);
    connectToQBO();
  };
  
  return (
    <div className="space-y-4">
      {popupBlocked && (
        <Alert variant="warning" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="ml-2">
            Popup windows appear to be blocked by your browser. Please allow popups for this site to connect with QuickBooks.
          </AlertDescription>
        </Alert>
      )}
      
      {connection ? (
        <Button 
          variant="outline" 
          onClick={disconnectFromQBO}
          className="text-red-600 border-red-200 hover:bg-red-50"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Disconnect from QuickBooks
        </Button>
      ) : (
        <Button onClick={handleConnect}>
          <ArrowUpRight className="mr-2 h-4 w-4" />
          Connect to QuickBooks {isSandboxMode ? "Sandbox" : ""}
        </Button>
      )}
    </div>
  );
}
