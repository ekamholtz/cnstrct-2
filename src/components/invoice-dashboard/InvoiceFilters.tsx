import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface InvoiceFiltersProps {
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
}

export const InvoiceFilters = ({ 
  statusFilter, 
  onStatusFilterChange 
}: InvoiceFiltersProps) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        <p className="text-gray-600">Manage and track all your invoices</p>
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
  );
};