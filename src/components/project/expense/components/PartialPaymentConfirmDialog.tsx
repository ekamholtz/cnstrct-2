
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PaymentDetailsData } from "../types";

interface PartialPaymentConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingData: PaymentDetailsData | null;
  expenseAmount: number;
  onConfirm: () => void;
}

export function PartialPaymentConfirmDialog({
  open,
  onOpenChange,
  pendingData,
  expenseAmount,
  onConfirm,
}: PartialPaymentConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Partial Payment</AlertDialogTitle>
          <AlertDialogDescription>
            The payment amount is less than the total expense amount. Would you like to save this as a partial payment?
            {pendingData && (
              <p className="mt-2">
                Remaining balance will be: ${(expenseAmount - Number(pendingData.payment_amount)).toFixed(2)}
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Confirm Partial Payment
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
