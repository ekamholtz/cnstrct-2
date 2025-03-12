
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExpenseFormErrorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  error: Error | null;
  onReset: () => void;
}

export function ExpenseFormErrorDialog({
  open,
  onOpenChange,
  error,
  onReset
}: ExpenseFormErrorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Error</DialogTitle>
        </DialogHeader>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>
            {error?.message || "An unexpected error occurred."}
          </AlertDescription>
        </Alert>
        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" onClick={onReset}>
            Try Again
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
