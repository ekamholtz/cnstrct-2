
import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ExpenseDetailsSection } from "@/components/project/expense/details/ExpenseDetailsSection";
import { PaymentsSection } from "@/components/project/expense/details/PaymentsSection";
import { useSyncExpenseToQBO } from "@/hooks/useSyncExpenseToQBO";
import { Expense } from "@/components/project/expense/types";

export function ExpenseDetails() {
  const { expenseId } = useParams<{ expenseId: string }>();
  const [syncError, setSyncError] = useState<string | null>(null);
  const { toast } = useToast();
  const { syncExpenseToQBO, isLoading: isSyncing } = useSyncExpenseToQBO();

  // Fetch expense data
  const { data: expense, refetch, isLoading } = useQuery({
    queryKey: ['expense', expenseId],
    queryFn: async () => {
      if (!expenseId) throw new Error("No expense ID provided");
      
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          project:project_id (
            name
          )
        `)
        .eq('id', expenseId)
        .single();
        
      if (error) throw error;
      return data as Expense & { project: { name: string } };
    },
    enabled: !!expenseId
  });

  const syncToQBO = async () => {
    if (!expense || isSyncing) return;
    
    try {
      setSyncError(null);
      
      // Call the syncExpenseToQBO method with the expense ID
      await syncExpenseToQBO(expense.id);
      
      // Refresh the expense data to show updated sync status
      refetch();
      
      toast({
        title: "Sync Successful",
        description: "Expense was successfully synced to QuickBooks Online",
      });
    } catch (error) {
      console.error("Error syncing to QBO:", error);
      setSyncError(error instanceof Error ? error.message : "Failed to sync expense to QBO");
      
      toast({
        title: "Sync Failed",
        description: "Failed to sync expense to QuickBooks Online. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="container py-8">Loading expense details...</div>;
  }

  if (!expense) {
    return <div className="container py-8">Expense not found</div>;
  }

  return (
    <div className="container py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Expense Details</h1>
        
        <Button 
          onClick={syncToQBO} 
          disabled={isSyncing}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isSyncing ? "Syncing..." : "Sync to QuickBooks"}
        </Button>
      </div>
      
      {syncError && (
        <Card className="p-4 bg-red-50 border-red-200 text-red-800">
          <p>Error syncing to QuickBooks: {syncError}</p>
        </Card>
      )}
      
      <ExpenseDetailsSection expense={expense} />
      
      {/* Fix for the PaymentsSection props issue - this component needs to be updated separately */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Payments</h2>
        {expense.payments && expense.payments.length > 0 ? (
          expense.payments.map((payment, index) => (
            <Card key={index} className="p-4">
              <div>{payment.amount} paid on {payment.payment_date}</div>
            </Card>
          ))
        ) : (
          <p>No payments recorded for this expense.</p>
        )}
      </div>
    </div>
  );
}

export default ExpenseDetails;
