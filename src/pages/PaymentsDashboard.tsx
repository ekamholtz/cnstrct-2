
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PaymentsTable } from "@/components/payments/PaymentsTable";
import { PaymentsFilter } from "@/components/payments/PaymentsFilter";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import type { PaymentFilters } from "@/components/payments/types";

export default function PaymentsDashboard() {
  const [filters, setFilters] = useState<PaymentFilters>({
    dateRange: { from: undefined, to: undefined },
    paymentType: undefined,
    projectId: undefined,
  });

  const { data: payments, isLoading } = useQuery({
    queryKey: ['payments', filters],
    queryFn: async () => {
      let query = supabase
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
        `);

      if (filters.dateRange.from) {
        query = query.gte('payment_date', filters.dateRange.from.toISOString());
      }
      if (filters.dateRange.to) {
        query = query.lte('payment_date', filters.dateRange.to.toISOString());
      }
      if (filters.paymentType) {
        query = query.eq('payment_type', filters.paymentType);
      }
      if (filters.projectId) {
        query = query.eq('expense.project.id', filters.projectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Payments Dashboard</h1>
        </div>

        <Card className="p-6">
          <PaymentsFilter filters={filters} onFiltersChange={setFilters} />
        </Card>

        <PaymentsTable payments={payments || []} isLoading={isLoading} />
      </div>
    </DashboardLayout>
  );
}
