import { DollarSign } from "lucide-react";
import { ExpenseForm } from "./ExpenseForm";
import { ExpenseList } from "./ExpenseList";
import { useExpenses } from "./hooks/useExpenses";
import type { ExpenseFormStage1Data, PaymentDetailsData, Expense } from "./types";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";

interface ProjectExpensesProps {
  projectId: string;
  expenses: Expense[];
}

export function ProjectExpenses({ projectId, expenses }: ProjectExpensesProps) {
  const { createExpense, createPayment } = useExpenses(projectId);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleCreateExpense = async (
    data: ExpenseFormStage1Data, 
    status: 'due' | 'paid' | 'partially_paid',
    paymentDetails?: PaymentDetailsData
  ) => {
    try {
      // Create the expense - note that payment_status is handled internally by useCreateExpense
      // The status parameter is only used to determine if we need to create a payment
      const expense = await createExpense(data);
      
      // If payment details are provided and status is not 'due', create a payment record
      if (paymentDetails && expense && status !== 'due') {
        // Convert amount from string to number for the API
        const paymentAmount = typeof paymentDetails.amount === 'string'
          ? parseFloat(paymentDetails.amount)
          : paymentDetails.amount;
          
        // Call createPayment with the correct parameter structure
        await createPayment({
          expenseId: expense.id,
          amount: paymentAmount,
          paymentDetails,
          expensesTable: 'expenses'
        });
      }

      // Invalidate relevant queries to trigger a refresh
      queryClient.invalidateQueries({ queryKey: ['expenses', projectId] });
      
    } catch (error) {
      console.error('Error creating expense:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create expense. Please try again.",
      });
    }
  };

  // Calculate totals and progress
  const totalExpenses = expenses?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0;
  const totalPaid = expenses?.reduce((sum, exp) => {
    // Safely handle payments array which might be undefined
    const paymentsTotal = exp.payments?.reduce((pSum, p) => pSum + (p.amount || 0), 0) ?? 0;
    return sum + paymentsTotal;
  }, 0) || 0;
  const pendingAmount = totalExpenses - totalPaid;
  const totalExpensesCount = expenses?.length || 0;
  const paidExpensesCount = expenses?.filter(exp => exp.payment_status === 'paid').length || 0;
  const progressPercentage = totalExpensesCount > 0 
    ? (paidExpensesCount / totalExpensesCount) * 100 
    : 0;

  return (
    <div className="space-y-6 px-6 pb-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Project Expenses</h2>
          <div className="flex items-center space-x-4">
            <span className="text-lg font-medium text-orange-600">
              Pending: ${pendingAmount.toLocaleString()}
            </span>
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-gray-500" />
              <span className="text-lg font-medium">
                Total: ${totalExpenses.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Payment Progress</span>
            <span>{paidExpensesCount} of {totalExpensesCount} expenses paid</span>
          </div>
          <Progress 
            value={progressPercentage} 
            className="h-2 bg-yellow-100 [&>div]:bg-green-500" 
          />
        </div>
      </div>

      <div className="flex justify-end mb-4">
        <ExpenseForm onSubmit={handleCreateExpense} defaultProjectId={projectId} />
      </div>

      <ExpenseList expenses={expenses ?? []} />
    </div>
  );
}
