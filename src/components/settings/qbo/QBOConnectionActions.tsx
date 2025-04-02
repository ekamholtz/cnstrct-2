
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, LogOut } from "lucide-react";

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
  return (
    <div>
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
        <Button onClick={connectToQBO}>
          <ArrowUpRight className="mr-2 h-4 w-4" />
          Connect to QuickBooks {isSandboxMode ? "Sandbox" : ""}
        </Button>
      )}
    </div>
  );
}
