
import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = "Preparing your subscription details..." 
}) => {
  return (
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-cnstrct-navy" />
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
};
