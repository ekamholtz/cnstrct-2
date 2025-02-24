
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ExpenseFormStage1Data, PaymentDetailsData, expenseFormStage1Schema } from "../types";
import { useToast } from "@/hooks/use-toast";

export function useExpenseForm({
  onSubmit,
  defaultProjectId,
}: {
  onSubmit: (
    data: ExpenseFormStage1Data,
    status: 'due' | 'paid' | 'partially_paid',
    paymentDetails?: PaymentDetailsData
  ) => Promise<void>;
  defaultProjectId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [showPaymentSimulation, setShowPaymentSimulation] = useState(false);
  const [stage1Data, setStage1Data] = useState<ExpenseFormStage1Data | null>(null);
  const { toast } = useToast();

  const form = useForm<ExpenseFormStage1Data>({
    resolver: zodResolver(expenseFormStage1Schema),
    defaultValues: {
      name: "",
      payee: "",
      amount: "",
      expense_date: "",
      expense_type: undefined,
      project_id: defaultProjectId || "",
      notes: "",
    },
  });

  const handleStage1Submit = async (data: ExpenseFormStage1Data, action: 'save_as_due' | 'save_as_paid' | 'pay') => {
    try {
      setIsProcessing(true);
      
      if (action === 'save_as_due') {
        await onSubmit(data, 'due');
        form.reset();
        setOpen(false);
        toast({
          title: "Success",
          description: "Expense saved as due",
        });
      } else if (action === 'save_as_paid') {
        setStage1Data(data);
        setShowPaymentDetails(true);
      } else if (action === 'pay') {
        setStage1Data(data);
        setShowPaymentSimulation(true);
      }
    } catch (error) {
      console.error("Error submitting expense:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save expense. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentSimulation = async (simulationData: any) => {
    if (!stage1Data) return;

    try {
      setIsProcessing(true);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await onSubmit(stage1Data, 'paid', {
        payment_method_code: 'transfer',
        payment_date: new Date().toISOString().split('T')[0],
        amount: simulationData.amount,
      });
      
      form.reset();
      setOpen(false);
      setShowPaymentSimulation(false);
      setStage1Data(null);
      
      toast({
        title: "Success",
        description: "Payment processed successfully",
      });
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

  return {
    form,
    open,
    setOpen,
    isProcessing,
    showPaymentDetails,
    setShowPaymentDetails,
    showPaymentSimulation,
    setShowPaymentSimulation,
    stage1Data,
    setStage1Data,
    handleStage1Submit,
    handlePaymentSimulation,
  };
}
