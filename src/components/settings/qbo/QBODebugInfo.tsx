
import React from 'react';
import { QBOConfig } from '@/integrations/qbo/config/qboConfig';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

export function QBODebugInfo() {
  // Use the getInstance() method to get the current configuration
  const qboConfig = QBOConfig.getInstance();
  
  return (
    <Alert className="my-4 bg-blue-50 border-blue-200">
      <InfoIcon className="h-4 w-4 text-blue-600" />
      <AlertTitle className="text-blue-800">QuickBooks Integration Configuration</AlertTitle>
      <AlertDescription className="mt-2 text-blue-700">
        <div className="space-y-2 text-sm font-mono break-all">
          <p><strong>Current Hostname:</strong> {window.location.hostname}</p>
          <p><strong>Environment:</strong> {qboConfig.isProduction ? 'Production' : 'Development'}</p>
          <p><strong>Client ID:</strong> {qboConfig.clientId}</p>
          <p><strong>Redirect URI:</strong> {qboConfig.redirectUri}</p>
          <p><strong>API Base URL:</strong> {qboConfig.apiBaseUrl}</p>
        </div>
      </AlertDescription>
    </Alert>
  );
}
