import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Expense, Payment } from "@/components/project/expense/types";
import { ExpenseDetailsSection } from "@/components/project/expense/details/ExpenseDetailsSection";
import { PaymentsSection } from "@/components/project/expense/details/PaymentsSection";
import { ExpensePaymentActions } from "@/components/project/expense/details/ExpensePaymentActions";
import { useEffect } from "react";

export default function ExpenseDetails() {
  const { expenseId } = useParams();
  const { data: expense, isLoading, refetch } = useQuery({
    queryKey: ['expense', expenseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          project:projects(name),
          payments(*)
        `)
        .eq('id', expenseId)
        .single();

      if (error) throw error;
      
      // Type assertion to make TypeScript happy with the structure
      return data as unknown as Expense & { 
        project: { name: string }, 
        payments: Payment[]
      };
    },
  });

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('expense-details')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses',
          filter: `id=eq.${expenseId}`,
        },
        () => {
          refetch();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
          filter: `expense_id=eq.${expenseId}`,
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [expenseId, refetch]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!expense) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-gray-900">Expense Not Found</h2>
          <p className="mt-2 text-gray-600">The expense you're looking for doesn't exist or you don't have permission to view it.</p>
          <Link to="/expenses" className="mt-4 inline-block">
            <Button variant="default">Return to Expenses</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <Link to="/expenses">
            <Button variant="ghost" className="text-gray-600">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Expenses
            </Button>
          </Link>
        </div>

        <div className="space-y-6">
          <ExpenseDetailsSection expense={expense} />
          <PaymentsSection payments={expense.payments} />
          <ExpensePaymentActions 
            expense={expense}
            showActions={['due', 'partially_paid'].includes(expense.payment_status)}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
