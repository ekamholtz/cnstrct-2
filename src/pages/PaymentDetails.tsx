
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";

export default function PaymentDetails() {
  const { paymentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: payment, isLoading } = useQuery({
    queryKey: ['payment', paymentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          expense:expense_id (
            id,
            name,
            amount,
            payment_status,
            project:project_id (
              id,
              name
            )
          )
        `)
        .eq('id', paymentId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const handleBack = () => {
    if (location.state?.from) {
      navigate(location.state.from);
    } else {
      navigate(`/expenses/${payment?.expense_id}`);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!payment) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-gray-900">Payment Not Found</h2>
          <p className="mt-2 text-gray-600">The payment you're looking for doesn't exist or you don't have permission to view it.</p>
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
          <Button 
            variant="ghost" 
            className="text-gray-600"
            onClick={handleBack}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>

        <Card className="p-6 space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Payment Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Payment ID</h3>
                <p className="mt-1 text-gray-900">{payment.id}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Payment Method</h3>
                <p className="mt-1 text-gray-900 capitalize">{payment.payment_method_code}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Payment Date</h3>
                <p className="mt-1 text-gray-900">
                  {format(new Date(payment.payment_date), 'MMM d, yyyy')}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Amount</h3>
                <p className="mt-1 text-gray-900">${payment.amount.toFixed(2)}</p>
              </div>

              {payment.status && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <p className="mt-1 text-gray-900 capitalize">{payment.status}</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {payment.notes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Notes</h3>
                  <p className="mt-1 text-gray-900">{payment.notes}</p>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-gray-500">Created At</h3>
                <p className="mt-1 text-gray-900">
                  {format(new Date(payment.created_at), 'MMM d, yyyy HH:mm:ss')}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Updated At</h3>
                <p className="mt-1 text-gray-900">
                  {format(new Date(payment.updated_at), 'MMM d, yyyy HH:mm:ss')}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Associated Expense</h3>
            <div className="space-y-2">
              <p className="text-gray-600">
                <span className="font-medium">Name:</span> {payment.expense.name}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Amount:</span> ${payment.expense.amount.toFixed(2)}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Status:</span>{' '}
                <span className="capitalize">{payment.expense.payment_status}</span>
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Project:</span>{' '}
                {payment.expense.project.name}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
