
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { RefreshCw, Link2, LinkOff } from 'lucide-react';
import { QBOTroubleshooting } from '@/utils/qboTroubleshooting';
import { QBOConnection } from '@/hooks/useQBOConnection';

interface QBOConnectionActionsProps {
  connection: QBOConnection | null;
  connectToQBO: () => Promise<boolean>;
  disconnectFromQBO: () => Promise<boolean>;
  testConnection?: () => Promise<boolean>;
  isSandboxMode: boolean;
}

export function QBOConnectionActions({ 
  connection, 
  connectToQBO, 
  disconnectFromQBO,
  testConnection,
  isSandboxMode 
}: QBOConnectionActionsProps) {
  const [isDisconnectDialogOpen, setIsDisconnectDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Handle connect button click
  const handleConnect = async () => {
    setIsLoading(true);
    
    // Clear existing QBO auth data
    QBOTroubleshooting.clearQBOAuthData();
    
    // Start connection flow
    await connectToQBO();
    
    setIsLoading(false);
  };
  
  // Handle disconnect confirmation
  const handleDisconnectConfirm = async () => {
    setIsLoading(true);
    await disconnectFromQBO();
    setIsLoading(false);
    setIsDisconnectDialogOpen(false);
  };
  
  // Handle test connection click
  const handleTestConnection = async () => {
    if (testConnection) {
      setIsLoading(true);
      await testConnection();
      setIsLoading(false);
    }
  };
  
  return (
    <>
      <div className="flex gap-3 justify-end">
        {connection ? (
          <>
            {testConnection && (
              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={isLoading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Test Connection
              </Button>
            )}
            
            <Button
              variant="destructive"
              onClick={() => setIsDisconnectDialogOpen(true)}
              disabled={isLoading}
            >
              <LinkOff className="h-4 w-4 mr-2" />
              Disconnect
            </Button>
          </>
        ) : (
          <Button 
            onClick={handleConnect}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Link2 className="h-4 w-4 mr-2" />
            Connect to {isSandboxMode ? 'QuickBooks Sandbox' : 'QuickBooks Online'}
          </Button>
        )}
      </div>
      
      {/* Disconnect Confirmation Dialog */}
      <AlertDialog open={isDisconnectDialogOpen} onOpenChange={setIsDisconnectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect QuickBooks</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disconnect from QuickBooks Online? This will remove the connection between your account and QuickBooks.
              {connection && (
                <p className="mt-2">
                  Currently connected to: <strong>{connection.company_name}</strong>
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDisconnectConfirm();
              }}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground"
            >
              {isLoading ? "Disconnecting..." : "Disconnect"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
