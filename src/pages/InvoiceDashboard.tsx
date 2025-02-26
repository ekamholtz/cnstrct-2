import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MainNav } from "@/components/navigation/MainNav";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { DateRange } from "react-day-picker";
import { DateRangeFilter } from "@/components/shared/filters/DateRangeFilter";
import { ProjectFilter } from "@/components/shared/filters/ProjectFilter";
import { Invoice } from "@/components/project/invoice/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type InvoiceStatus = "pending_payment" | "paid" | "cancelled" | "all";
type PaymentMethod = "cc" | "check" | "transfer" | "cash" | "all";

interface InvoiceFilters {
  dateRange: DateRange | undefined;
  status: InvoiceStatus;
  projectId: string;
  paymentMethod: PaymentMethod;
}

interface InvoiceListProps {
  data: Invoice[];
  isLoading: boolean;
}

function InvoiceList({ data, isLoading }: InvoiceListProps) {
  return <div>Invoice List Component</div>;
}

export default function InvoiceDashboard() {
  const [filters, setFilters] = useState<InvoiceFilters>({
    dateRange: undefined,
    status: "all",
    projectId: "all",
    paymentMethod: "all"
  });

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices', filters],
    queryFn: async () => {
      let query = supabase
        .from('invoices')
        .select(`
          *,
          project:project_id (
            name
          )
        `);

      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters.projectId !== 'all') {
        query = query.eq('project_id', filters.projectId);
      }
      if (filters.paymentMethod !== 'all') {
        query = query.eq('payment_method', filters.paymentMethod);
      }
      if (filters.dateRange?.from) {
        query = query.gte('created_at', filters.dateRange.from.toISOString());
      }
      if (filters.dateRange?.to) {
        query = query.lte('created_at', filters.dateRange.to.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Invoice[];
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
            <h1 className="text-2xl font-bold text-[#172b70]">Invoices Dashboard</h1>
            <p className="text-gray-600">Manage and track all project invoices</p>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-6 shadow-sm border-0">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select
              value={filters.status}
              onValueChange={(value: InvoiceStatus) => setFilters({ ...filters, status: value })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending_payment">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.paymentMethod}
              onValueChange={(value: PaymentMethod) => setFilters({ ...filters, paymentMethod: value })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Payment Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="cc">Credit Card</SelectItem>
                <SelectItem value="check">Check</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
              </SelectContent>
            </Select>

            <DateRangeFilter
              dateRange={filters.dateRange}
              onDateRangeChange={(range) => setFilters({ ...filters, dateRange: range })}
            />

            <ProjectFilter
              value={filters.projectId}
              onChange={(value) => setFilters({ ...filters, projectId: value })}
            />

            <Button
              variant="ghost"
              onClick={() => setFilters({
                dateRange: undefined,
                status: "all",
                projectId: "all",
                paymentMethod: "all"
              })}
            >
              Reset Filters
            </Button>
          </div>
        </Card>

        {/* Invoice List */}
        <Card className="shadow-sm border-0">
          <InvoiceList data={invoices || []} isLoading={isLoading} />
        </Card>
      </div>
    </div>
  );
}
