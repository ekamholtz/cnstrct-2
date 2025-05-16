
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { QBOAuthKitButton } from './QBOAuthKitButton';
import { QBOConnection } from '@/hooks/useQBOConnection';

interface QBOConnectionActionsProps {
  connection: QBOConnection | null;
  connectToQBO: () => Promise<boolean>;
  disconnectFromQBO: () => Promise<boolean>;
  testConnection: () => Promise<boolean>;
  isSandboxMode: boolean;
}

export function QBOConnectionActions({
  connection,
  disconnectFromQBO,
  testConnection,
  isSandboxMode
}: QBOConnectionActionsProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleDisconnect = async () => {
    setIsLoading('disconnect');
    await disconnectFromQBO();
    setIsLoading(null);
  };

  const handleTest = async () => {
    setIsLoading('test');
    await testConnection();
    setIsLoading(null);
  };

  // If no connection, show connect button
  if (!connection) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col space-y-2">
          <QBOAuthKitButton />
          <p className="text-xs text-gray-500 mt-1">
            {isSandboxMode
              ? "Using QuickBooks Sandbox environment"
              : "Connect to your QuickBooks Online account"}
          </p>
        </div>
      </div>
    );
  }

  // If connected, show disconnect and test buttons
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        onClick={handleTest}
        disabled={isLoading !== null}
      >
        {isLoading === 'test' ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : null}
        Test Connection
      </Button>
      <Button
        variant="destructive"
        onClick={handleDisconnect}
        disabled={isLoading !== null}
      >
        {isLoading === 'disconnect' ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : null}
        Disconnect
      </Button>
    </div>
  );
}
