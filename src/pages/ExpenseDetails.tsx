
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowLeft, Check, ExternalLink, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { PaymentDetailsForm } from "@/components/project/expense/form/PaymentDetailsForm";
import { ExpenseDetailsSection } from "@/components/project/expense/details/ExpenseDetailsSection";
import { PaymentsSection } from "@/components/project/expense/details/PaymentsSection";
import { ExpensePaymentActions } from "@/components/project/expense/details/ExpensePaymentActions";
import { useSyncExpenseToQBO } from "@/hooks/useSyncExpenseToQBO";
import { QBOIntegrationSection } from "@/components/project/expense/components/QBOIntegrationSection";

export default function ExpenseDetails() {
  const { expenseId } = useParams<{ expenseId: string }>();
  const navigate = useNavigate();
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const syncExpenseMutation = useSyncExpenseToQBO();

  // Fetch expense details
  const { data: expense, isLoading, error } = useQuery({
    queryKey: ['expense', expenseId],
    queryFn: async () => {
      if (!expenseId) return null;
      
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          projects:project_id (name),
          payments (*)
        `)
        .eq('id', expenseId)
        .single();
      
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!expenseId
  });

  // Handle QBO sync
  const handleSync = async () => {
    if (!expense) return;
    
    try {
      await syncExpenseMutation.syncExpenseToQBO({
        id: expense.id,
        name: expense.name,
        expense_date: expense.expense_date,
        amount: expense.amount,
        expense_type: expense.expense_type,
        vendor_name: expense.vendor_name,
        project_id: expense.project_id,
        notes: expense.notes,
        qbo_sync_status: expense.qbo_sync_status,
        qbo_entity_id: expense.qbo_entity_id
      });
    } catch (error) {
      console.error("Error syncing expense:", error);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-10 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !expense) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-10">
          <div className="flex items-center gap-2 text-red-500 mb-4">
            <AlertCircle className="h-5 w-5" />
            <span>Error loading expense details: {error?.message || "Expense not found"}</span>
          </div>
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-10">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" onClick={() => navigate(-1)} className="mr-auto">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          
          <Button 
            onClick={handleSync} 
            disabled={syncExpenseMutation.isPending || expense.qbo_sync_status === 'synced'}
            className="flex items-center gap-2"
          >
            {syncExpenseMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : expense.qbo_sync_status === 'synced' ? (
              <Check className="h-4 w-4" />
            ) : (
              <ExternalLink className="h-4 w-4" />
            )}
            {expense.qbo_sync_status === 'synced' ? 'Synced to QBO' : 'Sync to QuickBooks'}
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-2xl">Expense Details</CardTitle>
                <Badge className={`
                  ${expense.status === 'paid' ? 'bg-green-100 text-green-800' : 
                    expense.status === 'partial' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-blue-100 text-blue-800'}
                `}>
                  {expense.status === 'paid' ? 'Paid' : 
                    expense.status === 'partial' ? 'Partially Paid' : 'Pending'}
                </Badge>
              </CardHeader>
              <CardContent>
                <ExpenseDetailsSection expense={expense} />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Payments</CardTitle>
              </CardHeader>
              <CardContent>
                {showPaymentForm ? (
                  <PaymentDetailsForm 
                    amountDue={expense.amount}
                    expenseAmount={expense.amount}
                    onSubmit={async (data) => {
                      // Handle payment submission logic
                      console.log("Payment submitted:", data);
                      setShowPaymentForm(false);
                    }}
                    onCancel={() => setShowPaymentForm(false)}
                  />
                ) : (
                  <>
                    <PaymentsSection payments={expense.payments || []} />
                    <ExpensePaymentActions
                      expense={expense}
                      onAddPayment={() => setShowPaymentForm(true)}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>QuickBooks Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <QBOIntegrationSection 
                  syncStatus={expense.qbo_sync_status || 'not_synced'} 
                  entityId={expense.qbo_entity_id}
                  onSync={handleSync}
                  isSyncing={syncExpenseMutation.isPending}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Expense Created</p>
                      <p className="text-xs text-muted-foreground">
                        {expense.created_at ? format(new Date(expense.created_at), 'PPP') : 'Unknown date'}
                      </p>
                    </div>
                  </div>
                  
                  {expense.payments && expense.payments.length > 0 && expense.payments.map((payment, index) => (
                    <div key={payment.id} className="flex items-start gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500 mt-2"></div>
                      <div>
                        <p className="text-sm font-medium">
                          Payment of ${payment.amount.toFixed(2)} recorded
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {payment.created_at ? format(new Date(payment.created_at), 'PPP') : 'Unknown date'}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {expense.qbo_sync_status === 'synced' && (
                    <div className="flex items-start gap-2">
                      <div className="h-2 w-2 rounded-full bg-purple-500 mt-2"></div>
                      <div>
                        <p className="text-sm font-medium">Synced to QuickBooks</p>
                        <p className="text-xs text-muted-foreground">
                          {expense.updated_at ? format(new Date(expense.updated_at), 'PPP') : 'Unknown date'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
