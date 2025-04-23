
import React from 'react';
import { QBOConfig } from '@/integrations/qbo/config/qboConfig';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon, AlertTriangle } from 'lucide-react';

export function QBODebugInfo() {
  // Use the getInstance() method instead of direct instantiation
  const qboConfig = QBOConfig.getInstance();
  const hostname = window.location.hostname;
  const port = window.location.port;
  
  // Helper function to create a URL with the same parameters as the auth URL
  const testAuthUrl = (): string => {
    const params = new URLSearchParams({
      client_id: qboConfig.clientId,
      response_type: 'code',
      scope: qboConfig.scopes.join(' '), // Using space as it's automatically encoded to '+' in URL
      redirect_uri: qboConfig.redirectUri,
      state: 'test-state'
    });
    
    return `${qboConfig.authEndpoint}?${params.toString()}`;
  };
  
  const authUrl = testAuthUrl();
  
  // Check if the hostname in the redirect URI matches the current hostname
  const redirectUriHostname = new URL(qboConfig.redirectUri).hostname;
  const hostnameMatches = hostname === redirectUriHostname;
  
  return (
    <Alert className="my-4 bg-blue-50 border-blue-200">
      <InfoIcon className="h-4 w-4 text-blue-600" />
      <AlertTitle className="text-blue-800">QuickBooks Integration Debug Info</AlertTitle>
      <AlertDescription className="mt-2 text-blue-700">
        <div className="space-y-2 text-sm font-mono break-all">
          <p><strong>Current Hostname:</strong> {hostname}</p>
          {port && <p><strong>Port:</strong> {port}</p>}
          <p><strong>Redirect URI:</strong> {qboConfig.redirectUri}</p>
          <p><strong>Scopes:</strong> {qboConfig.scopes.join(', ')}</p>
          <p><strong>Auth Endpoint:</strong> {qboConfig.authEndpoint}</p>
          <p><strong>Environment:</strong> {qboConfig.isProduction ? 'Production' : 'Sandbox'}</p>
          <p><strong>Full Auth URL:</strong> <span className="text-xs">{authUrl}</span></p>
          
          {!hostnameMatches && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start">
              <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-700">Hostname Mismatch Warning</p>
                <p className="text-amber-600 text-xs">
                  The current hostname <strong>"{hostname}"</strong> does not match the hostname in the redirect URI <strong>"{redirectUriHostname}"</strong>.
                  This may cause authentication errors with Intuit.
                </p>
              </div>
            </div>
          )}
        </div>
        <p className="mt-3 text-xs text-blue-600">
          <strong>Important:</strong> Make sure this exact Redirect URI is registered in your Intuit Developer Portal.
          The scopes should match what's configured in your app on the Intuit Developer Portal.
        </p>
      </AlertDescription>
    </Alert>
  );
}
