
import React from 'react';
import { QBOConfig } from '@/integrations/qbo/config/qboConfig';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

export function QBODebugInfo() {
  const qboConfig = new QBOConfig();
  
  return (
    <Alert className="my-4 bg-blue-50 border-blue-200">
      <InfoIcon className="h-4 w-4 text-blue-600" />
      <AlertTitle className="text-blue-800">QuickBooks Integration Debug Info</AlertTitle>
      <AlertDescription className="text-blue-700">
        <p className="mt-1 text-sm font-mono break-all">
          <strong>Current Redirect URI:</strong> {qboConfig.redirectUri}
        </p>
        <p className="mt-1 text-xs text-blue-600">
          Make sure this exact URL is registered in your Intuit Developer Portal.
        </p>
      </AlertDescription>
    </Alert>
  );
}
