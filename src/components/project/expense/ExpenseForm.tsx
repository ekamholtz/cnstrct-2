
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { type ExpenseFormStage1Data, type PaymentDetailsData, type Expense } from "./types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PaymentDetailsForm } from "./form/PaymentDetailsForm";
import { PaymentSimulationForm } from "./form/PaymentSimulationForm";
import { ExpenseFormContent } from "./components/ExpenseFormContent";
import { useExpenseForm } from "./hooks/useExpenseForm";
import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { QBOIntegrationSection } from "./components/QBOIntegrationSection";
import { ExpenseFormErrorDialog } from "./components/ExpenseFormErrorDialog";
import { useExpenseQBOSync } from "./hooks/useExpenseQBOSync";

interface ExpenseFormProps {
  onSubmit: (
    data: ExpenseFormStage1Data, 
    status: 'due' | 'paid' | 'partially_paid',
    paymentDetails?: PaymentDetailsData
  ) => Promise<void>;
  defaultProjectId?: string;
}

export function ExpenseForm({ onSubmit, defaultProjectId }: ExpenseFormProps) {
  const { toast } = useToast();
  const [error, setError] = useState<Error | null>(null);
  const { 
    connection, 
    glAccountId, 
    setGlAccountId, 
    syncExpenseToQBO, 
    isSyncing 
  } = useExpenseQBOSync();
  
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
  } = useExpenseForm({ 
    onSubmit: async (data, status, paymentDetails) => {
      try {
        setError(null);
        // First submit the expense to our system
        await onSubmit(data, status, paymentDetails);
        
        // Then if we have a QBO connection and a GL account selected, sync to QBO
        if (connection && glAccountId && stage1Data) {
          // Create a properly typed Expense object
          const expense: Expense = {
            id: crypto.randomUUID(), // This would be the actual ID returned from your API
            project_id: stage1Data.project_id,
            name: stage1Data.name,
            amount: parseFloat(stage1Data.amount),
            payee: stage1Data.payee,
            expense_date: stage1Data.expense_date,
            expense_type: stage1Data.expense_type,
            notes: stage1Data.notes || undefined,
            payment_status: status,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          // Sync to QBO
          await syncExpenseToQBO(expense);
        }
        
        // Reset form state
        form.reset();
        setOpen(false);
        setShowPaymentDetails(false);
        setStage1Data(null);
        setGlAccountId("");
      } catch (error) {
        console.error("Error creating expense:", error);
        setError(error instanceof Error ? error : new Error("An unknown error occurred"));
        toast({
          title: "Error creating expense",
          description: error instanceof Error ? error.message : "An unknown error occurred",
          variant: "destructive"
        });
      }
    }, 
    defaultProjectId 
  });

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  // If there's an error, show the error dialog
  if (error) {
    return (
      <ExpenseFormErrorDialog
        open={open}
        onOpenChange={setOpen}
        error={error}
        onReset={resetError}
      />
    );
  }

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
              amountDue={Number(stage1Data.amount)}
              onSubmit={async (paymentData: PaymentDetailsData) => {
                try {
                  await onSubmit(stage1Data, 'paid', paymentData);
                  form.reset();
                  setOpen(false);
                  setShowPaymentDetails(false);
                  setStage1Data(null);
                } catch (error) {
                  console.error("Error processing payment:", error);
                  setError(error instanceof Error ? error : new Error("An unknown error occurred"));
                }
              }}
              onCancel={() => {
                setShowPaymentDetails(false);
                setStage1Data(null);
              }}
            />
          ) : (
            <>
              <ExpenseFormContent
                form={form}
                isProcessing={isProcessing || isSyncing}
                defaultProjectId={defaultProjectId}
                onCancel={() => setOpen(false)}
                onSubmit={(action) => form.handleSubmit((data) => handleStage1Submit(data, action))()}
              />
              
              <QBOIntegrationSection
                hasConnection={!!connection}
                glAccountId={glAccountId}
                onGlAccountChange={setGlAccountId}
              />
            </>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
