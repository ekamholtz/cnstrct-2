
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
      payment_type: undefined,
      payment_date: new Date().toISOString().split('T')[0],
      payment_amount: amountDue.toString(),
    },
  });

  const handleSubmit = async (data: PaymentDetailsData) => {
    const paymentAmount = Number(data.payment_amount);
    
    if (paymentAmount > amountDue) {
      setShowErrorAlert(true);
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
    } catch (error) {
      console.error("Error processing payment:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process payment. Please try again.",
      });
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
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process partial payment. Please try again.",
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
