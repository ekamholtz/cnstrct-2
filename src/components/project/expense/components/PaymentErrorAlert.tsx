
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface PaymentErrorAlertProps {
  expenseAmount: number;
}

export function PaymentErrorAlert({ expenseAmount }: PaymentErrorAlertProps) {
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Invalid Payment Amount</AlertTitle>
      <AlertDescription>
        Payment amount cannot exceed the expense amount of ${expenseAmount}
      </AlertDescription>
    </Alert>
  );
}
