
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, BuildingIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface QBOConnection {
  id: string;
  company_id: string;
  company_name: string;
  created_at: string;
  updated_at: string;
}

interface QBOConnectionDetailsProps {
  connection: QBOConnection;
  isSandboxMode: boolean;
}

export function QBOConnectionDetails({ connection, isSandboxMode }: QBOConnectionDetailsProps) {
  // Get the date objects for created and updated
  const createdDate = new Date(connection.created_at);
  const updatedDate = new Date(connection.updated_at);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold">{connection.company_name}</h3>
          <div className="text-sm text-gray-500">
            Company ID: {connection.company_id}
          </div>
        </div>
        <Badge variant={isSandboxMode ? "secondary" : "default"} className={isSandboxMode ? "bg-amber-500" : ""}>
          {isSandboxMode ? "Sandbox" : "Production"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <CalendarIcon className="h-4 w-4" />
          <span>
            Connected {formatDistanceToNow(createdDate, { addSuffix: true })}
          </span>
        </div>

        <div className="flex items-center gap-2 text-gray-600">
          <BuildingIcon className="h-4 w-4" />
          <span>
            Last updated {formatDistanceToNow(updatedDate, { addSuffix: true })}
          </span>
        </div>
      </div>
    </div>
  );
}
