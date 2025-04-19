
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ErrorStateProps {
  errorMessage: string;
  onRetry: () => void;
}

export function ErrorState({ errorMessage, onRetry }: ErrorStateProps) {
  return (
    <div className="space-y-4">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{errorMessage}</AlertDescription>
      </Alert>
      
      <div className="flex justify-center pt-2">
        <Button onClick={onRetry}>
          Try Again
        </Button>
      </div>
    </div>
  );
}
