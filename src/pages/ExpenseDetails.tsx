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
import ErrorBoundary from "@/components/common/ErrorBoundary";

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
      
      // Transform the data to match the expected Payment interface
      const transformedPayments = data.payments.map((payment: any) => ({
        id: payment.id,
        direction: payment.direction || 'outgoing',
        amount: payment.amount,
        payment_method_code: payment.payment_method_code,
        status: payment.status || 'completed',
        payment_date: payment.payment_date,
        notes: payment.notes,
        created_at: payment.created_at,
        updated_at: payment.updated_at,
        simulation_mode: payment.simulation_mode || false,
        // Include other required fields with defaults if needed
        invoice_id: payment.invoice_id,
        expense_id: payment.expense_id,
        payment_processor_id: payment.payment_processor_id,
        processor_transaction_id: payment.processor_transaction_id,
        processor_metadata: payment.processor_metadata,
        simulation_data: payment.simulation_data
      }));
      
      return {
        ...data,
        payments: transformedPayments
      } as Expense & { 
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

  useEffect(() => {
    if (!isLoading) {
      refetch();
    }
  }, [expenseId, refetch, isLoading]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading expense details...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!expense || typeof expense !== 'object') {
    return (
      <DashboardLayout>
        <div>
          <Link to="/expenses">
            <Button variant="ghost" className="text-gray-600">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Expenses
            </Button>
          </Link>
          <div className="mt-8 p-4 border border-red-200 rounded-md bg-red-50">
            <h2 className="text-lg font-semibold text-red-700 mb-2">Expense not found</h2>
            <p className="text-sm text-red-600">
              The expense you are looking for could not be found or has been deleted.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Ensure expense has all required properties with defaults
  const safeExpense = {
    ...expense,
    payments: Array.isArray(expense.payments) ? expense.payments : [],
    payment_status: expense.payment_status || 'due',
    amount: typeof expense.amount === 'number' ? expense.amount : 0,
    amount_due: typeof expense.amount_due === 'number' ? expense.amount_due : expense.amount || 0,
    project: expense.project || { name: 'Unknown Project' }
  };

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
          <ExpenseDetailsSection expense={safeExpense} />
          <PaymentsSection payments={safeExpense.payments} />
          <div className="mt-6">
            <ErrorBoundary
              fallback={
                <div className="p-4 border border-red-200 rounded-md bg-red-50">
                  <p className="text-sm text-red-600">
                    Unable to display payment options. Please try refreshing the page.
                  </p>
                </div>
              }
            >
              <ExpensePaymentActions 
                expense={safeExpense}
                showActions={true}
                disableActions={safeExpense.payment_status === 'paid'}
              />
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
