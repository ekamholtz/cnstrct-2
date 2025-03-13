
import { Separator } from "@/components/ui/separator";
import { GLAccountSelect } from "../GLAccountSelect";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, ExternalLink, Loader2 } from "lucide-react";

interface QBOIntegrationSectionProps {
  hasConnection?: boolean;
  glAccountId?: string;
  onGlAccountChange?: (value: string) => void;
  syncStatus?: 'not_synced' | 'syncing' | 'synced' | 'failed';
  entityId?: string;
  onSync?: () => Promise<void>;
  isSyncing?: boolean;
}

export function QBOIntegrationSection({ 
  hasConnection, 
  glAccountId, 
  onGlAccountChange,
  syncStatus,
  entityId,
  onSync,
  isSyncing = false
}: QBOIntegrationSectionProps) {
  // If no QBO connection or this is in the GLAccount selection context
  if (onGlAccountChange && glAccountId !== undefined) {
    if (!hasConnection) {
      return null;
    }
    
    return (
      <>
        <Separator className="my-4" />
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">QuickBooks Integration</h4>
          <GLAccountSelect 
            value={glAccountId} 
            onChange={onGlAccountChange} 
          />
        </div>
      </>
    );
  }
  
  // If this is in the sync status context
  if (syncStatus) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">QuickBooks Online Status</h4>
            {syncStatus === 'synced' && entityId && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Synced
              </Badge>
            )}
            {syncStatus === 'not_synced' && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                Not Synced
              </Badge>
            )}
            {syncStatus === 'failed' && (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                Sync Failed
              </Badge>
            )}
          </div>
          
          {syncStatus === 'synced' && entityId && (
            <p className="text-sm text-muted-foreground">QuickBooks Entity ID: {entityId}</p>
          )}
          
          {syncStatus !== 'synced' && onSync && (
            <Button
              onClick={onSync}
              disabled={isSyncing}
              variant="outline"
              size="sm"
              className="mt-2 w-full"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                  Syncing...
                </>
              ) : (
                <>
                  <ExternalLink className="mr-2 h-4 w-4" /> 
                  Sync to QuickBooks
                </>
              )}
            </Button>
          )}
          
          {syncStatus === 'synced' && entityId && (
            <p className="text-xs text-muted-foreground mt-2">
              This expense has been successfully synced to QuickBooks Online.
            </p>
          )}
        </div>
      </div>
    );
  }
  
  return null;
}
