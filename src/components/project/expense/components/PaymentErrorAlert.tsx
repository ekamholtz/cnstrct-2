
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface PaymentErrorAlertProps {
  amountDue: number;
}

export function PaymentErrorAlert({ amountDue }: PaymentErrorAlertProps) {
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Invalid Payment Amount</AlertTitle>
      <AlertDescription>
        Payment amount cannot exceed the remaining amount due of ${amountDue}
      </AlertDescription>
    </Alert>
  );
}
