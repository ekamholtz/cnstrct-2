
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
      console.log('Fetching payments with filters:', filters);
      
      let query = supabase
        .from('payments')
        .select(`
          id,
          payment_type,
          payment_date,
          payment_amount,
          vendor_email,
          vendor_phone,
          created_at,
          updated_at,
          expense:expense_id (
            id,
            name,
            amount,
            payment_status,
            project_id,
            project:project_id (
              id,
              name
            )
          )
        `);

      // Apply filters
      if (filters.dateRange.from) {
        query = query.gte('payment_date', filters.dateRange.from.toISOString());
      }
      if (filters.dateRange.to) {
        query = query.lte('payment_date', filters.dateRange.to.toISOString());
      }
      if (filters.paymentType) {
        query = query.eq('payment_type', filters.paymentType);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching payments:', error);
        throw error;
      }
      
      console.log('Fetched payments:', data);
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
