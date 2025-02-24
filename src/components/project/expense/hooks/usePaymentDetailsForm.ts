
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PaymentDetailsData, paymentDetailsSchema } from "../types";
import { useToast } from "@/hooks/use-toast";

export function usePaymentDetailsForm({
  expenseAmount,
  amountDue,
  onSubmit,
}: {
  expenseAmount: number;
  amountDue: number;
  onSubmit: (data: PaymentDetailsData, isPartialPayment: boolean) => Promise<void>;
}) {
  const [showPartialPaymentConfirm, setShowPartialPaymentConfirm] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingData, setPendingData] = useState<PaymentDetailsData | null>(null);
  const { toast } = useToast();

  const form = useForm<PaymentDetailsData>({
    resolver: zodResolver(paymentDetailsSchema),
    defaultValues: {
      payment_method_code: undefined,
      payment_date: new Date().toISOString().split('T')[0],
      amount: amountDue.toString(),
      notes: "",
    },
  });

  const handleSubmit = async (data: PaymentDetailsData) => {
    const paymentAmount = Number(data.amount);
    
    if (paymentAmount > amountDue) {
      setShowErrorAlert(true);
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: `Payment amount cannot exceed ${amountDue.toFixed(2)}`,
      });
      return;
    }

    if (paymentAmount < amountDue) {
      setPendingData(data);
      setShowPartialPaymentConfirm(true);
      return;
    }

    try {
      setIsProcessing(true);
      await onSubmit(data, false);
      toast({
        variant: "default",
        title: "Success",
        description: "Payment processed successfully",
      });
    } catch (error) {
      console.error("Error processing payment:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process payment. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePartialPaymentConfirm = async () => {
    if (!pendingData) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No payment data found. Please try again.",
      });
      return;
    }
    
    try {
      setIsProcessing(true);
      await onSubmit(pendingData, true);
      toast({
        variant: "default",
        title: "Success",
        description: "Partial payment processed successfully",
      });
    } catch (error) {
      console.error("Error processing partial payment:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process partial payment. Please try again.",
      });
    } finally {
      setIsProcessing(false);
      setShowPartialPaymentConfirm(false);
    }
  };

  return {
    form,
    showPartialPaymentConfirm,
    setShowPartialPaymentConfirm,
    showErrorAlert,
    setShowErrorAlert,
    isProcessing,
    pendingData,
    handleSubmit,
    handlePartialPaymentConfirm,
  };
}
