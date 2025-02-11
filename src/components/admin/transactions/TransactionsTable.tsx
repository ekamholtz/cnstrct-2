
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { TransactionType } from "./TransactionFilters";

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  status: string;
  created_at: string;
  milestones?: { name: string };
  projects?: { name: string };
}

interface Expense {
  id: string;
  name: string;
  payee: string;
  amount: number;
  expense_date: string;
  notes?: string;
  projects?: { name: string };
}

interface TransactionsTableProps {
  transactionType: TransactionType;
  invoices: Invoice[];
  expenses: Expense[];
}

export function TransactionsTable({ transactionType, invoices, expenses }: TransactionsTableProps) {
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending_payment':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Details</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status/Date</TableHead>
            <TableHead>Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Render Invoices */}
          {(transactionType === 'all' || transactionType === 'invoice') && invoices.map((invoice) => (
            <TableRow key={`invoice-${invoice.id}`}>
              <TableCell>Invoice</TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">#{invoice.invoice_number}</span>
                  <span className="text-sm text-gray-500">{invoice.milestones?.name}</span>
                </div>
              </TableCell>
              <TableCell>{invoice.projects?.name}</TableCell>
              <TableCell>${invoice.amount.toLocaleString()}</TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <Badge className={getStatusBadgeColor(invoice.status)}>
                    {invoice.status}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {format(new Date(invoice.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
              </TableCell>
              <TableCell>-</TableCell>
            </TableRow>
          ))}

          {/* Render Expenses */}
          {(transactionType === 'all' || transactionType === 'expense') && expenses.map((expense) => (
            <TableRow key={`expense-${expense.id}`}>
              <TableCell>Expense</TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{expense.name}</span>
                  <span className="text-sm text-gray-500">Payee: {expense.payee}</span>
                </div>
              </TableCell>
              <TableCell>{expense.projects?.name}</TableCell>
              <TableCell>${expense.amount.toLocaleString()}</TableCell>
              <TableCell>
                {format(new Date(expense.expense_date), 'MMM d, yyyy')}
              </TableCell>
              <TableCell className="max-w-xs truncate">
                {expense.notes || '-'}
              </TableCell>
            </TableRow>
          ))}

          {invoices.length === 0 && expenses.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-4">
                No transactions found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
