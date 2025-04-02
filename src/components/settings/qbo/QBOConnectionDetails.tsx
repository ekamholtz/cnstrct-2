
import React from "react";
import { CheckCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface DisplayQBOConnection {
  id: string;
  company_id: string;
  company_name: string;
  created_at: string;
  updated_at: string;
}

interface QBOConnectionDetailsProps {
  connection: DisplayQBOConnection;
  isSandboxMode: boolean;
}

export function QBOConnectionDetails({ connection, isSandboxMode }: QBOConnectionDetailsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 text-green-600">
        <CheckCircle className="h-5 w-5" />
        <span className="font-medium">Connected to QuickBooks Online</span>
      </div>
      
      <div className="bg-muted p-4 rounded-md">
        <h3 className="font-semibold mb-2">Connection Details</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Company:</span>
            <span className="font-medium">{connection.company_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Environment:</span>
            <span>{isSandboxMode ? "Sandbox (Test)" : "Production"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Connected:</span>
            <span>{formatDistanceToNow(new Date(connection.created_at), { addSuffix: true })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Last Updated:</span>
            <span>{formatDistanceToNow(new Date(connection.updated_at), { addSuffix: true })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
