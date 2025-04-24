
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useQBOConnection } from '@/hooks/useQBOConnection';
import { Badge } from '@/components/ui/badge';

interface QBOConnectionDetailsProps {
  connection: {
    id: string;
    company_id: string;
    company_name: string;
    created_at: string;
    updated_at: string;
  };
  isSandboxMode: boolean;
}

export function QBOConnectionDetails({ connection, isSandboxMode }: QBOConnectionDetailsProps) {
  // Format dates for display
  const formattedCreatedAt = formatDistanceToNow(new Date(connection.created_at), { addSuffix: true });
  const formattedUpdatedAt = formatDistanceToNow(new Date(connection.updated_at), { addSuffix: true });
  
  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Connection Status</h3>
        <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-200">Connected</Badge>
      </div>
      
      <div className="bg-white p-4 rounded-md border border-gray-200 space-y-3">
        <div>
          <p className="text-sm font-semibold">Company Name</p>
          <p className="text-base">{connection.company_name}</p>
        </div>
        
        <div>
          <p className="text-sm font-semibold">Company ID</p>
          <p className="text-sm text-muted-foreground font-mono">{connection.company_id}</p>
        </div>
        
        <div>
          <p className="text-sm font-semibold">Environment</p>
          <div className="flex items-center mt-1">
            {isSandboxMode ? (
              <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Sandbox</Badge>
            ) : (
              <Badge variant="default" className="text-xs">Production</Badge>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-semibold">Connected</p>
            <p className="text-sm text-muted-foreground">{formattedCreatedAt}</p>
          </div>
          <div>
            <p className="text-sm font-semibold">Last Updated</p>
            <p className="text-sm text-muted-foreground">{formattedUpdatedAt}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
