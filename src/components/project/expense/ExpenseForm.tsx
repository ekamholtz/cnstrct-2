import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { expenseFormStage1Schema, paymentDetailsSchema, type ExpenseFormStage1Data, type PaymentDetailsData, type Expense } from "./types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PaymentDetailsForm } from "./form/PaymentDetailsForm";
import { PaymentSimulationForm } from "./form/PaymentSimulationForm";
import { ExpenseFormContent } from "./components/ExpenseFormContent";
import { useExpenseForm } from "./hooks/useExpenseForm";
import { useQBOConnection } from "@/hooks/useQBOConnection";
import { GLAccountSelect } from "./GLAccountSelect";
import { useSyncExpenseToQBO } from "@/hooks/useSyncExpenseToQBO";
import { Separator } from "@/components/ui/separator";
import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

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
  const { connection } = useQBOConnection();
  const [glAccountId, setGlAccountId] = useState<string>("");
  const syncExpenseMutation = useSyncExpenseToQBO();
  const [error, setError] = useState<Error | null>(null);
  
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
          try {
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
            await syncExpenseMutation.mutateAsync({ 
              expense,
              glAccountId 
            });
          } catch (qboError) {
            console.error("Error syncing to QBO:", qboError);
            toast({
              title: "QBO Sync Failed",
              description: qboError instanceof Error ? qboError.message : "Failed to sync expense to QuickBooks Online",
              variant: "destructive"
            });
            
            // Even though QBO sync failed, the expense was created successfully
            // so we'll continue with resetting the form
          }
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

  if (error) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="bg-[#9b87f5] hover:bg-[#7E69AB]">
            <Plus className="mr-2 h-4 w-4" />
            Create Expense
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>
              {error.message || "An unexpected error occurred."}
            </AlertDescription>
          </Alert>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={resetError}>
              Try Again
            </Button>
            <Button onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
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
                isProcessing={isProcessing || syncExpenseMutation.isPending}
                defaultProjectId={defaultProjectId}
                onCancel={() => setOpen(false)}
                onSubmit={(action) => form.handleSubmit((data) => handleStage1Submit(data, action))()}
              />
              
              {connection && (
                <>
                  <Separator className="my-4" />
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2">QuickBooks Integration</h4>
                    <GLAccountSelect 
                      value={glAccountId} 
                      onChange={setGlAccountId} 
                    />
                  </div>
                </>
              )}
            </>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
