
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QBOTroubleshooting } from "@/utils/qboTroubleshooting";
import { ChevronDown, ChevronUp, RefreshCw, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface DiagnosticInfo {
  environment: string;
  clientId: string;
  redirectUri: string;
  authUrl: string;
  currentUrl: string;
  currentOrigin: string;
  currentHostname: string;
  qboScopes: string[];
  popupsBlocked: boolean | null;
  cookiesEnabled: boolean;
  localStorageAvailable: boolean;
  hasAuthSession: boolean;
}

export function QBODiagnosticInfo() {
  const [diagnosticInfo, setDiagnosticInfo] = useState<DiagnosticInfo | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const loadDiagnosticInfo = async () => {
    setIsLoading(true);
    try {
      const info = await QBOTroubleshooting.getDiagnosticInfo();
      setDiagnosticInfo(info);
    } catch (error) {
      console.error("Error loading QBO diagnostic info:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (isExpanded && !diagnosticInfo) {
      loadDiagnosticInfo();
    }
  }, [isExpanded, diagnosticInfo]);
  
  const handleClearData = () => {
    try {
      QBOTroubleshooting.clearAllQBOData();
      toast({
        title: "QBO Data Cleared",
        description: "All QuickBooks authentication data has been cleared from your browser."
      });
      loadDiagnosticInfo();
    } catch (error) {
      console.error("Error clearing QBO data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to clear QuickBooks data."
      });
    }
  };
  
  return (
    <Card className="mt-6 border border-dashed bg-muted/30">
      <CardHeader className="py-3">
        <CardTitle 
          className="text-sm font-medium flex items-center cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronUp className="mr-2 h-4 w-4" />
          ) : (
            <ChevronDown className="mr-2 h-4 w-4" />
          )}
          QBO Connection Diagnostics
        </CardTitle>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="px-4 pb-4 pt-0 text-sm">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              <span>Loading diagnostic information...</span>
            </div>
          ) : diagnosticInfo ? (
            <>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="font-medium">Environment:</div>
                  <div>{diagnosticInfo.environment}</div>
                  
                  <div className="font-medium">Redirect URI:</div>
                  <div className="overflow-hidden text-ellipsis">{diagnosticInfo.redirectUri}</div>
                  
                  <div className="font-medium">Current Domain:</div>
                  <div>{diagnosticInfo.currentHostname}</div>
                  
                  <div className="font-medium">QBO Scopes:</div>
                  <div>{diagnosticInfo.qboScopes.join(', ')}</div>
                  
                  <div className="font-medium">Popups Blocked:</div>
                  <div>{diagnosticInfo.popupsBlocked === null ? 'Unknown' : 
                         diagnosticInfo.popupsBlocked ? 'Yes' : 'No'}</div>
                  
                  <div className="font-medium">Cookies Enabled:</div>
                  <div>{diagnosticInfo.cookiesEnabled ? 'Yes' : 'No'}</div>
                  
                  <div className="font-medium">LocalStorage Available:</div>
                  <div>{diagnosticInfo.localStorageAvailable ? 'Yes' : 'No'}</div>
                  
                  <div className="font-medium">Has Auth Session:</div>
                  <div>{diagnosticInfo.hasAuthSession ? 'Yes' : 'No'}</div>
                </div>
                
                {(!diagnosticInfo.cookiesEnabled || !diagnosticInfo.localStorageAvailable || diagnosticInfo.popupsBlocked === true) && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center">
                    <AlertCircle className="text-red-500 h-4 w-4 mr-2" />
                    <div className="text-red-700">
                      <p className="font-medium">Authentication Issues Detected</p>
                      <ul className="list-disc list-inside mt-1 text-xs">
                        {!diagnosticInfo.cookiesEnabled && (
                          <li>Cookies are disabled. Enable cookies for this site.</li>
                        )}
                        {!diagnosticInfo.localStorageAvailable && (
                          <li>LocalStorage is not available. Check browser privacy settings.</li>
                        )}
                        {diagnosticInfo.popupsBlocked === true && (
                          <li>Popups are blocked. Allow popups for this site.</li>
                        )}
                      </ul>
                    </div>
                  </div>
                )}
                
                <div className="flex space-x-2 mt-4">
                  <Button size="sm" variant="outline" onClick={loadDiagnosticInfo}>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Refresh Diagnostics
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600" onClick={handleClearData}>
                    Clear QBO Auth Data
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div>Failed to load diagnostic information</div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
