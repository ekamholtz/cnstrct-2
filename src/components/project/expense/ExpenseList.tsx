
import { formatDistanceToNow } from "date-fns";
import { FileText } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/project/invoice/StatusBadge";
import type { Expense } from "./types";
import { Progress } from "@/components/ui/progress";

interface ExpenseListProps {
  expenses: (Expense & { project?: { name: string } })[];
  loading?: boolean;
  showProjectName?: boolean;
}

// Helper function to map expense status to invoice status
const mapExpenseStatusToInvoiceStatus = (status: Expense['payment_status']): "paid" | "pending_payment" | "cancelled" => {
  switch (status) {
    case "paid":
      return "paid";
    case "partially_paid":
    case "due":
      return "pending_payment";
    default:
      return "pending_payment";
  }
};

export function ExpenseList({ expenses, loading }: ExpenseListProps) {
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalPaid = expenses.reduce((sum, exp) => {
    return sum + (exp.payments?.reduce((pSum, p) => pSum + p.amount, 0) ?? 0);
  }, 0);

  const paidCount = expenses.filter(exp => exp.payment_status === 'paid').length;
  const totalCount = expenses.length;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Project Expenses</h2>
        <div className="flex items-center gap-4">
          <div className="text-orange-600">
            Pending: ${(totalExpenses - totalPaid).toLocaleString()}
          </div>
          <div>
            Total: ${totalExpenses.toLocaleString()}
          </div>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Payment Progress</span>
          <span>{paidCount} of {totalCount} expenses paid</span>
        </div>
        <Progress 
          value={(paidCount / Math.max(totalCount, 1)) * 100} 
          className="h-2 bg-gray-100 [&>div]:bg-green-500"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Expense Number</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-500" />
                    {expense.expense_number}
                  </div>
                </TableCell>
                <TableCell>{expense.name}</TableCell>
                <TableCell>${expense.amount.toLocaleString()}</TableCell>
                <TableCell>
                  <StatusBadge status={mapExpenseStatusToInvoiceStatus(expense.payment_status)} />
                </TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(expense.expense_date), { addSuffix: true })}
                </TableCell>
                <TableCell className="uppercase">{expense.expense_type}</TableCell>
                <TableCell>
                  <button className="text-gray-500 hover:text-gray-700">
                    Mark as Paid
                  </button>
                </TableCell>
              </TableRow>
            ))}
            {expenses.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6 text-gray-500">
                  No expenses found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
