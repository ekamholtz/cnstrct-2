
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Terminal } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { QBOAuthKitButton } from './QBOAuthKitButton';

export function QBODiagnosticInfo() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTestLoading, setIsTestLoading] = useState(false);

  return (
    <div className="mt-4 border-t pt-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium">Diagnostic Tools</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Hide' : 'Show'}
        </Button>
      </div>

      {isExpanded && (
        <div className="space-y-3">
          <Alert variant="info">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Troubleshooting</AlertTitle>
            <AlertDescription className="text-xs">
              The tools below can help diagnose connection issues with QuickBooks Online.
            </AlertDescription>
          </Alert>

          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={isTestLoading}
              onClick={() => {
                setIsTestLoading(true);
                setTimeout(() => setIsTestLoading(false), 1000);
              }}
            >
              {isTestLoading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
              Test API Access
            </Button>
            
            <QBOAuthKitButton 
              variant="outline" 
              size="sm"
              onSuccess={() => {
                console.log("AuthKit test connection successful");
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
