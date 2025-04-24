
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, ChevronDown, ChevronUp, RefreshCw, Trash2 } from 'lucide-react';
import { QBOTroubleshooting } from '@/utils/qboTroubleshooting';
import { useToast } from '@/components/ui/use-toast';

export function QBODiagnosticInfo() {
  const [isOpen, setIsOpen] = useState(false);
  const [diagnosticInfo, setDiagnosticInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const fetchDiagnosticInfo = async () => {
    try {
      setIsLoading(true);
      const info = await QBOTroubleshooting.getDiagnosticInfo();
      setDiagnosticInfo(info);
    } catch (error) {
      console.error('Error fetching diagnostic info:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (isOpen && !diagnosticInfo) {
      fetchDiagnosticInfo();
    }
  }, [isOpen, diagnosticInfo]);
  
  const handleClearData = () => {
    QBOTroubleshooting.clearAllQBOData();
    toast({
      title: 'QBO Data Cleared',
      description: 'All QuickBooks Online storage data has been cleared.',
    });
    // Refresh diagnostic info
    fetchDiagnosticInfo();
  };
  
  return (
    <div className="mt-6">
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="w-full"
      >
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="flex w-full justify-between">
            <span>Diagnostic Information</span>
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Troubleshooting Info</AlertTitle>
            <AlertDescription>
              This section contains diagnostic information for troubleshooting QuickBooks Online integration issues.
            </AlertDescription>
          </Alert>
          
          <div className="mt-4 space-y-4">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchDiagnosticInfo}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh Info
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleClearData} 
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear QBO Data
              </Button>
            </div>
            
            {diagnosticInfo ? (
              <div className="rounded border p-4 text-xs font-mono whitespace-pre-wrap bg-slate-50">
                <h4 className="text-sm font-semibold mb-2">Environment: {diagnosticInfo.environment}</h4>
                <Separator className="my-2" />
                <div className="grid grid-cols-2 gap-2">
                  <div>URL: {diagnosticInfo.currentUrl}</div>
                  <div>Hostname: {diagnosticInfo.currentHostname}</div>
                  <div>Popups Blocked: {diagnosticInfo.popupsBlocked ? '❌ Yes' : '✅ No'}</div>
                  <div>Cookies Enabled: {diagnosticInfo.cookiesEnabled ? '✅ Yes' : '❌ No'}</div>
                  <div>LocalStorage: {diagnosticInfo.localStorageAvailable ? '✅ Available' : '❌ Unavailable'}</div>
                  <div>Auth Session: {diagnosticInfo.hasAuthSession ? '✅ Present' : '❌ None'}</div>
                </div>
              </div>
            ) : isLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-500"></div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                Click "Refresh Info" to load diagnostic data
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
