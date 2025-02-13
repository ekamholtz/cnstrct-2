
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DollarSign } from "lucide-react";
import { InvoiceStatus } from "@/hooks/useInvoiceDashboard";
import { Card } from "@/components/ui/card";

interface InvoiceFiltersProps {
  statusFilter: InvoiceStatus;
  onStatusFilterChange: (value: InvoiceStatus) => void;
  invoices: Array<{
    amount: number;
    status: string;
  }>;
}

export const InvoiceFilters = ({ 
  statusFilter, 
  onStatusFilterChange,
  invoices
}: InvoiceFiltersProps) => {
  const totalPendingAmount = invoices
    .filter(inv => inv.status === 'pending_payment')
    .reduce((sum, inv) => sum + Number(inv.amount), 0);

  return (
    <Card className="p-6 mt-6">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Invoices</h2>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-gray-600">Manage and track all your invoices</p>
            <div className="flex items-center gap-1 text-orange-600 font-medium">
              <DollarSign className="h-4 w-4" />
              <span>Pending: ${totalPendingAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>
        <Select
          value={statusFilter}
          onValueChange={onStatusFilterChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Invoices</SelectItem>
            <SelectItem value="pending_payment">Pending Payment</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </Card>
  );
};
