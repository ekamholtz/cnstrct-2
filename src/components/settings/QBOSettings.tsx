
import React from "react";
import { useQBOConnection } from "@/hooks/useQBOConnection";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { QBOConnectionDetails } from "./qbo/QBOConnectionDetails";
import { QBOConnectionActions } from "./qbo/QBOConnectionActions";
import { QBOConnectionStatus } from "./qbo/QBOConnectionStatus";
import { QBOSyncInformation } from "./qbo/QBOSyncInformation";
import { QBONoConnectionInfo } from "./qbo/QBONoConnectionInfo";
import { QBODebugInfo } from "./qbo/QBODebugInfo";
import { QBOErrorBoundary } from "@/components/error/QBOErrorBoundary";

// Define a type for QBO Connection that includes all required fields
interface QBOConnection {
  id: string;
  company_id: string;
  company_name: string;
  created_at: string;
  updated_at: string;
  access_token: string;
  refresh_token: string;
}

// Define a safe version for display/props without sensitive data
interface DisplayQBOConnection {
  id: string;
  company_id: string;
  company_name: string;
  created_at: string;
  updated_at: string;
}

export function QBOSettings() {
  const { connection, isLoading, error, connectToQBO, disconnectFromQBO } = useQBOConnection();
  
  // Check if we're in development/sandbox mode
  const isSandboxMode = window.location.hostname === 'localhost' || 
                         window.location.hostname.includes('127.0.0.1');
  
  // Create a display-safe connection object without sensitive fields
  const displayConnection: DisplayQBOConnection | null = connection ? {
    id: connection.id,
    company_id: connection.company_id,
    company_name: connection.company_name,
    created_at: connection.created_at,
    updated_at: connection.updated_at
  } : null;
  
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
          ) : displayConnection ? (
            <>
              <QBOConnectionDetails 
                connection={displayConnection} 
                isSandboxMode={isSandboxMode} 
              />
              <QBOSyncInformation />
            </>
          ) : (
            <QBONoConnectionInfo isSandboxMode={isSandboxMode} />
          )}
        </CardContent>
        
        <CardFooter className="flex justify-end">
          {!isLoading && (
            <QBOConnectionActions 
              connection={displayConnection}
              connectToQBO={connectToQBO}
              disconnectFromQBO={disconnectFromQBO}
              isSandboxMode={isSandboxMode}
            />
          )}
        </CardFooter>
      </Card>
    </QBOErrorBoundary>
  );
}
