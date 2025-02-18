
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Form } from "@/components/ui/form";
import { Plus } from "lucide-react";
import { ExpenseFormStage1Data, PaymentDetailsData, expenseFormStage1Schema } from "./types";
import { ExpenseNameField } from "./form/ExpenseNameField";
import { ExpensePayeeField } from "./form/ExpensePayeeField";
import { ExpenseAmountField } from "./form/ExpenseAmountField";
import { ExpenseDateField } from "./form/ExpenseDateField";
import { ExpenseTypeField } from "./form/ExpenseTypeField";
import { ExpenseNotesField } from "./form/ExpenseNotesField";
import { ExpenseProjectField } from "./form/ExpenseProjectField";
import { useToast } from "@/hooks/use-toast";
import { PaymentDetailsForm } from "./form/PaymentDetailsForm";
import { PaymentSimulationForm } from "./form/PaymentSimulationForm";

interface ExpenseFormProps {
  onSubmit: (
    data: ExpenseFormStage1Data, 
    status: 'due' | 'paid' | 'partially_paid',
    paymentDetails?: PaymentDetailsData
  ) => Promise<void>;
  defaultProjectId?: string;
}

export function ExpenseForm({ onSubmit, defaultProjectId }: ExpenseFormProps) {
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
        payment_type: 'transfer',
        payment_date: new Date().toISOString().split('T')[0],
        payment_amount: simulationData.payment_amount,
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#9b87f5] hover:bg-[#7E69AB]">
          <Plus className="mr-2 h-4 w-4" />
          Create Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {showPaymentSimulation ? "Process Payment" : 
             showPaymentDetails ? "Payment Details" : 
             "Create New Expense"}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-8rem)] overflow-y-auto pr-4">
          {showPaymentSimulation && stage1Data ? (
            <PaymentSimulationForm
              initialPayee={stage1Data.payee}
              initialAmount={stage1Data.amount}
              onSubmit={handlePaymentSimulation}
              onCancel={() => {
                setShowPaymentSimulation(false);
                setStage1Data(null);
              }}
            />
          ) : showPaymentDetails && stage1Data ? (
            <PaymentDetailsForm
              expenseAmount={Number(stage1Data.amount)}
              onSubmit={async (data, isPartialPayment) => {
                try {
                  await onSubmit(
                    stage1Data, 
                    isPartialPayment ? 'partially_paid' : 'paid',
                    data
                  );
                  
                  form.reset();
                  setOpen(false);
                  setShowPaymentDetails(false);
                  setStage1Data(null);
                  
                  toast({
                    title: "Success",
                    description: isPartialPayment 
                      ? "Partial payment processed successfully" 
                      : "Payment processed successfully",
                  });
                } catch (error) {
                  console.error("Error processing payment:", error);
                  toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to process payment. Please try again.",
                  });
                }
              }}
              onCancel={() => {
                setShowPaymentDetails(false);
                setStage1Data(null);
              }}
            />
          ) : (
            <Form {...form}>
              <form className="space-y-4">
                <ExpenseNameField form={form} />
                <ExpenseAmountField form={form} />
                <ExpensePayeeField form={form} />
                <ExpenseDateField form={form} />
                <ExpenseTypeField form={form} />
                {!defaultProjectId && <ExpenseProjectField form={form} />}
                <ExpenseNotesField form={form} />
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                    disabled={isProcessing}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={form.handleSubmit((data) => handleStage1Submit(data, 'save_as_due'))}
                    disabled={isProcessing}
                    className="bg-[#7E69AB] hover:bg-[#9b87f5] text-white"
                  >
                    Save as Due
                  </Button>
                  <Button
                    type="button"
                    onClick={form.handleSubmit((data) => handleStage1Submit(data, 'save_as_paid'))}
                    disabled={isProcessing}
                    className="bg-[#9b87f5] hover:bg-[#7E69AB] text-white"
                  >
                    Save as Paid
                  </Button>
                  <Button
                    type="button"
                    onClick={form.handleSubmit((data) => handleStage1Submit(data, 'pay'))}
                    disabled={isProcessing}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Pay Now
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
