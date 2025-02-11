
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";

export type TransactionType = 'all' | 'invoice' | 'expense';
export type TransactionStatus = 'all' | 'pending_payment' | 'paid';

interface TransactionFiltersProps {
  transactionType: TransactionType;
  setTransactionType: (value: TransactionType) => void;
  statusFilter: TransactionStatus;
  setStatusFilter: (value: TransactionStatus) => void;
  projectFilter: string;
  setProjectFilter: (value: string) => void;
  projects?: { id: string; name: string; }[];
}

export function TransactionFilters({
  transactionType,
  setTransactionType,
  statusFilter,
  setStatusFilter,
  projectFilter,
  setProjectFilter,
  projects,
}: TransactionFiltersProps) {
  return (
    <Card className="mb-6">
      <div className="p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <Select value={transactionType} onValueChange={(value) => setTransactionType(value as TransactionType)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Transaction type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Transactions</SelectItem>
              <SelectItem value="invoice">Invoices Only</SelectItem>
              <SelectItem value="expense">Expenses Only</SelectItem>
            </SelectContent>
          </Select>

          {(transactionType === 'all' || transactionType === 'invoice') && (
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as TransactionStatus)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending_payment">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          )}

          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects?.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
}
