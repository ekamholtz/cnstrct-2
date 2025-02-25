
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

  const { data: payments, isLoading } = useQuery({
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
      
      return data as Payment[];
    },
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

        <Card className="p-6 shadow-sm border-0">
          <PaymentsFilter filters={filters} onFiltersChange={setFilters} />
        </Card>

        <Card className="shadow-sm border-0">
          <PaymentsTable payments={payments || []} isLoading={isLoading} />
        </Card>
      </div>
    </div>
  );
}
