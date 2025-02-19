
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExpenseFormStage1Data, PaymentDetailsData } from "./types";
import { PaymentDetailsForm } from "./form/PaymentDetailsForm";
import { PaymentSimulationForm } from "./form/PaymentSimulationForm";
import { ExpenseFormContent } from "./components/ExpenseFormContent";
import { useExpenseForm } from "./hooks/useExpenseForm";

interface ExpenseFormProps {
  onSubmit: (
    data: ExpenseFormStage1Data, 
    status: 'due' | 'paid' | 'partially_paid',
    paymentDetails?: PaymentDetailsData
  ) => Promise<void>;
  defaultProjectId?: string;
}

export function ExpenseForm({ onSubmit, defaultProjectId }: ExpenseFormProps) {
  const {
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
  } = useExpenseForm({ onSubmit, defaultProjectId });

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
                } catch (error) {
                  console.error("Error processing payment:", error);
                }
              }}
              onCancel={() => {
                setShowPaymentDetails(false);
                setStage1Data(null);
              }}
            />
          ) : (
            <ExpenseFormContent
              form={form}
              isProcessing={isProcessing}
              defaultProjectId={defaultProjectId}
              onCancel={() => setOpen(false)}
              onSubmit={(action) => form.handleSubmit((data) => handleStage1Submit(data, action))()}
            />
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
