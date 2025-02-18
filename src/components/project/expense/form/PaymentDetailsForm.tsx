
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { PaymentDetailsData, paymentDetailsSchema } from "../types";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface PaymentDetailsFormProps {
  expenseAmount: number;
  onSubmit: (data: PaymentDetailsData, isPartialPayment: boolean) => Promise<void>;
  onCancel: () => void;
}

export function PaymentDetailsForm({ expenseAmount, onSubmit, onCancel }: PaymentDetailsFormProps) {
  const [showPartialPaymentConfirm, setShowPartialPaymentConfirm] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingData, setPendingData] = useState<PaymentDetailsData | null>(null);

  const form = useForm<PaymentDetailsData>({
    resolver: zodResolver(paymentDetailsSchema),
    defaultValues: {
      payment_type: undefined,
      payment_date: new Date().toISOString().split('T')[0],
      payment_amount: expenseAmount.toString(),
    },
  });

  const handleSubmit = async (data: PaymentDetailsData) => {
    const paymentAmount = Number(data.payment_amount);
    
    if (paymentAmount > expenseAmount) {
      setShowErrorAlert(true);
      return;
    }

    if (paymentAmount < expenseAmount) {
      setPendingData(data);
      setShowPartialPaymentConfirm(true);
      return;
    }

    try {
      setIsProcessing(true);
      await onSubmit(data, false);
    } catch (error) {
      console.error("Error processing payment:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePartialPaymentConfirm = async () => {
    if (!pendingData) return;
    
    try {
      setIsProcessing(true);
      await onSubmit(pendingData, true);
    } catch (error) {
      console.error("Error processing partial payment:", error);
    } finally {
      setIsProcessing(false);
      setShowPartialPaymentConfirm(false);
    }
  };

  return (
    <>
      {showErrorAlert && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Invalid Payment Amount</AlertTitle>
          <AlertDescription>
            Payment amount cannot exceed the expense amount of ${expenseAmount}
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="payment_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="cc">Credit Card</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="payment_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="payment_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Amount</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      min="0" 
                      max={expenseAmount} 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Maximum amount: ${expenseAmount}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isProcessing}
              className="bg-[#9b87f5] hover:bg-[#7E69AB]"
            >
              {isProcessing ? "Processing..." : "Process Payment"}
            </Button>
          </div>
        </form>
      </Form>

      <AlertDialog open={showPartialPaymentConfirm} onOpenChange={setShowPartialPaymentConfirm}>
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
            <AlertDialogAction onClick={handlePartialPaymentConfirm}>
              Confirm Partial Payment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
