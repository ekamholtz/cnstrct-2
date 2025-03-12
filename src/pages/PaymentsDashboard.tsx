
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PaymentsTable } from "@/components/payments/PaymentsTable";
import { PaymentsFilter } from "@/components/payments/PaymentsFilter";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import type { PaymentFilters, Payment } from "@/components/payments/types";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { MainNav } from "@/components/navigation/MainNav";

export default function PaymentsDashboard() {
  const [filters, setFilters] = useState<PaymentFilters>({
    dateRange: { from: undefined, to: undefined },
    direction: undefined,
    status: undefined,
    paymentMethodCode: undefined,
    projectId: undefined,
  });

  const { data: rawPayments, isLoading } = useQuery({
    queryKey: ['payments', filters],
    queryFn: async () => {
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
      
      return data;
    },
  });

  // Transform raw payment data to match the Payment type
  const payments: Payment[] = (rawPayments || []).map(payment => {
    // Format the invoice and expense data to match required types
    const formattedPayment: Payment = {
      id: payment.id,
      direction: payment.direction as Payment['direction'],
      amount: payment.amount,
      payment_method_code: payment.payment_method_code as Payment['payment_method_code'],
      status: payment.status as Payment['status'],
      invoice_id: payment.invoice_id,
      expense_id: payment.expense_id,
      payment_processor_id: payment.payment_processor_id,
      processor_transaction_id: payment.processor_transaction_id,
      processor_metadata: payment.processor_metadata,
      simulation_mode: payment.simulation_mode,
      simulation_data: payment.simulation_data,
      notes: payment.notes,
      payment_date: payment.payment_date,
      created_at: payment.created_at,
      updated_at: payment.updated_at,
      // Format invoice and expense to match required types
      invoice: payment.invoice ? {
        invoice_number: payment.invoice.invoice_number,
        amount: payment.invoice.amount,
        project: {
          name: payment.invoice.project ? payment.invoice.project.name : 'Unknown Project'
        }
      } : undefined,
      expense: payment.expense ? {
        name: payment.expense.name,
        project: {
          name: payment.expense.project ? payment.expense.project.name : 'Unknown Project'
        }
      } : undefined
    };
    
    return formattedPayment;
  });

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <div className="bg-[#172b70] text-white">
        <MainNav />
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
          <PaymentsTable payments={payments} isLoading={isLoading} />
        </Card>
      </div>
    </div>
  );
}
