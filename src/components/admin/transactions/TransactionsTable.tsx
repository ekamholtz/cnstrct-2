
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
import { FileText } from "lucide-react";
import type { Expense } from "@/components/project/expense/types";

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  status: string;
  created_at: string;
  milestones?: { name: string };
  projects?: { name: string };
}

interface TransactionsTableProps {
  transactionType: TransactionType;
  invoices: Invoice[];
  expenses: Expense[];
  onExpenseClick?: (expenseId: string) => void;
  isLoading?: boolean;
}

export function TransactionsTable({ 
  transactionType, 
  invoices, 
  expenses, 
  onExpenseClick,
  isLoading 
}: TransactionsTableProps) {
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending_payment':
      case 'due':
      case 'partially_paid':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Number</TableHead>
            <TableHead>Details</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Render Invoices */}
          {(transactionType === 'all' || transactionType === 'invoice') && invoices.map((invoice) => (
            <TableRow key={`invoice-${invoice.id}`}>
              <TableCell>#{invoice.invoice_number}</TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">Invoice</span>
                  <span className="text-sm text-gray-500">{invoice.milestones?.name}</span>
                </div>
              </TableCell>
              <TableCell>{invoice.projects?.name}</TableCell>
              <TableCell>${invoice.amount.toLocaleString()}</TableCell>
              <TableCell>
                <Badge className={getStatusBadgeColor(invoice.status)}>
                  {invoice.status.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell>
                {format(new Date(invoice.created_at), 'MMM d, yyyy')}
              </TableCell>
              <TableCell>Invoice</TableCell>
            </TableRow>
          ))}

          {/* Render Expenses */}
          {(transactionType === 'all' || transactionType === 'expense') && expenses.map((expense) => (
            <TableRow 
              key={`expense-${expense.id}`}
              className={onExpenseClick ? "cursor-pointer hover:bg-gray-50" : ""}
              onClick={() => onExpenseClick && onExpenseClick(expense.id)}
            >
              <TableCell>
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-1 text-gray-400" />
                  {expense.expense_number}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{expense.name}</span>
                  <span className="text-xs text-gray-500">
                    {expense.payee}
                  </span>
                </div>
              </TableCell>
              <TableCell>{expense.projects?.name}</TableCell>
              <TableCell>${expense.amount.toLocaleString()}</TableCell>
              <TableCell>
                <Badge className={getStatusBadgeColor(expense.payment_status)}>
                  {expense.payment_status === 'due' ? 'pending payment' : expense.payment_status.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell>
                {format(new Date(expense.expense_date), 'MMM d, yyyy')}
              </TableCell>
              <TableCell className="uppercase text-xs font-semibold text-gray-500">
                {expense.expense_type}
              </TableCell>
            </TableRow>
          ))}

          {((transactionType === 'invoice' && invoices.length === 0) || 
             (transactionType === 'expense' && expenses.length === 0) ||
             (transactionType === 'all' && invoices.length === 0 && expenses.length === 0)) && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-4">
                No transactions found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
