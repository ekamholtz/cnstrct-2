import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PaymentsTable } from "@/components/payments/PaymentsTable";
import { PaymentsFilter } from "@/components/payments/PaymentsFilter";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useState, useMemo } from "react";
import type { PaymentFilters, Payment } from "@/components/payments/types";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { MainNav } from "@/components/navigation/MainNav";
import { useDataFetching } from "@/hooks/useDataFetching";
import { formatCurrency } from "@/utils/formatters";

/**
 * PaymentsDashboard component
 * Displays and manages payment records with filtering capabilities
 */
export default function PaymentsDashboard() {
  // Local UI state for filters (ephemeral UI state using useState)
  const [filters, setFilters] = useState<PaymentFilters>({
    dateRange: { from: undefined, to: undefined },
    direction: undefined,
    status: undefined,
    paymentMethodCode: undefined,
    projectId: undefined,
  });

  // Server state using useDataFetching for standardized error handling
  const { data: rawPayments, isLoading, error } = useDataFetching(
    ['payments', filters],
    async () => {
      console.log('Fetching payments with filters:', filters);
      
      let query = supabase
        .from('payments')
        .select(`
          id,
          direction,
          amount,
          payment_method_code,
          status,
          invoice_id,
          expense_id,
          payment_processor_id,
          processor_transaction_id,
          processor_metadata,
          simulation_mode,
          simulation_data,
          notes,
          payment_date,
          created_at,
          updated_at,
          invoice:invoice_id (
            invoice_number,
            amount,
            project:project_id (
              name
            )
          ),
          expense:expense_id (
            name,
            project:project_id (
              name
            )
          )
        `);

      // Apply filters
      if (filters.direction) {
        query = query.eq('direction', filters.direction);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.paymentMethodCode) {
        query = query.eq('payment_method_code', filters.paymentMethodCode);
      }
      if (filters.dateRange.from) {
        query = query.gte('payment_date', filters.dateRange.from.toISOString());
      }
      if (filters.dateRange.to) {
        query = query.lte('payment_date', filters.dateRange.to.toISOString());
      }
      if (filters.projectId) {
        query = query.or(`invoice.project_id.eq.${filters.projectId},expense.project_id.eq.${filters.projectId}`);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching payments:', error);
        throw error;
      }
      
      return data || [];
    }
  );

  // Derived state using useMemo (computed from rawPayments)
  const mappedPayments = useMemo(() => {
    if (!rawPayments || !rawPayments.length) return [];
    
    return rawPayments.map(payment => {
      // Handle invoice-related payments
      let paymentInvoice = undefined;
      if (payment.invoice && payment.invoice[0]) {
        const invoice = payment.invoice[0];
        let projectName = '';
        if (invoice.project && invoice.project[0]) {
          projectName = invoice.project[0].name || 'Unknown';
        }
        
        paymentInvoice = {
          invoice_number: invoice.invoice_number,
          amount: invoice.amount,
          project: { name: projectName }
        };
      }
      
      // Handle expense-related payments
      let paymentExpense = undefined;
      if (payment.expense && payment.expense[0]) {
        const expense = payment.expense[0];
        let projectName = '';
        if (expense.project && expense.project[0]) {
          projectName = expense.project[0].name || 'Unknown';
        }
        
        paymentExpense = {
          name: expense.name,
          project: { name: projectName }
        };
      }
      
      // Transform to match the expected Payment type
      return {
        id: payment.id,
        amount: typeof payment.amount === 'number' ? payment.amount : parseFloat(String(payment.amount)) || 0,
        payment_date: payment.payment_date,
        status: payment.status,
        direction: payment.direction,
        payment_method_code: payment.payment_method_code,
        notes: payment.notes || '',
        created_at: payment.created_at,
        updated_at: payment.updated_at,
        invoice_id: payment.invoice_id,
        expense_id: payment.expense_id,
        invoice: paymentInvoice,
        expense: paymentExpense,
        payment_processor_id: payment.payment_processor_id,
        processor_transaction_id: payment.processor_transaction_id,
        processor_metadata: payment.processor_metadata,
        simulation_data: payment.simulation_data,
        simulation_mode: payment.simulation_mode
      } as Payment;
    });
  }, [rawPayments]);

  // Additional derived state
  const totalAmount = useMemo(() => {
    if (!mappedPayments.length) return 0;
    return mappedPayments.reduce((sum, payment) => sum + payment.amount, 0);
  }, [mappedPayments]);

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <div className="bg-[#172b70] text-white">
        <MainNav showSettingsInNav={false} />
      </div>
      <div className="container mx-auto px-4 py-8 mt-16 space-y-8">
        {/* Dashboard Header */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <Link to="/dashboard">
              <Button variant="ghost" className="text-gray-600">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            
            {!isLoading && mappedPayments.length > 0 && (
              <div className="text-right">
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="text-xl font-semibold text-[#172b70]">
                  {formatCurrency(totalAmount)}
                </p>
              </div>
            )}
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-[#172b70]">Payments Dashboard</h1>
            <p className="text-gray-600">Track and manage all payment transactions</p>
          </div>
        </div>

        <Card 
          variant="glass" 
          className="shadow-md border border-white/20 backdrop-blur-sm"
        >
          <PaymentsFilter filters={filters} onFiltersChange={setFilters} />
        </Card>

        <Card 
          variant="glass" 
          className="shadow-md border border-white/20 backdrop-blur-sm mt-6"
        >
          <PaymentsTable 
            payments={mappedPayments} 
            isLoading={isLoading}
            error={error}
          />
        </Card>
      </div>
    </div>
  );
}
