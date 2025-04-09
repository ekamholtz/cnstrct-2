
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface ErrorStateProps {
  errorMessage: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ 
  errorMessage,
  onRetry
}) => {
  const navigate = useNavigate();
  
  return (
    <div className="text-center text-red-500">
      <p className="font-semibold">There was an error</p>
      <p className="text-sm mt-2">{errorMessage}</p>
      <div className="flex gap-3 justify-center mt-4">
        {onRetry && (
          <Button 
            onClick={onRetry}
            variant="outline"
          >
            Try Again
          </Button>
        )}
        <Button 
          onClick={() => navigate('/dashboard')}
          className="bg-cnstrct-navy text-white hover:bg-cnstrct-navy/90"
        >
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
};
