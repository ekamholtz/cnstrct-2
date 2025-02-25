
import { formatDistanceToNow } from "date-fns";
import { DollarSign, Receipt } from "lucide-react";
import { HomeownerExpense } from "./types";
import { Skeleton } from "@/components/ui/skeleton";
import { HomeownerExpenseActions } from "./components/HomeownerExpenseActions";
import { useHomeownerExpenses } from "./hooks/useHomeownerExpenses";
import { PaymentDetailsData } from "./types";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/project/invoice/StatusBadge";

interface HomeownerExpenseListProps {
  expenses: (HomeownerExpense & { project?: { name: string } })[];
  loading?: boolean;
  projectId?: string;  // Make projectId optional
}

export function HomeownerExpenseList({ expenses, loading, projectId }: HomeownerExpenseListProps) {
  const { updatePaymentStatus } = useHomeownerExpenses(projectId);
  const totalExpenses = expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
  const totalDue = expenses?.reduce((sum, exp) => sum + exp.amount_due, 0) || 0;

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  const handlePaymentSubmit = async (expenseId: string, paymentData: PaymentDetailsData) => {
    await updatePaymentStatus({ expenseId, paymentData });
  };

  const handlePaymentSimulation = async (
    expenseId: string, 
    data: { payment_amount: string; payee_email?: string; payee_phone?: string }
  ) => {
    const paymentData: PaymentDetailsData = {
      payment_method_code: 'transfer',
      payment_date: new Date().toISOString().split('T')[0],
      amount: Number(data.payment_amount),
      notes: `Simulated payment. Contact: ${data.payee_email || ''} ${data.payee_phone || ''}`
    };
    await updatePaymentStatus({ expenseId, paymentData });
  };

  const paidExpenses = expenses?.filter(exp => exp.payment_status === "paid").length || 0;
  const progressPercentage = expenses.length > 0 ? (paidExpenses / expenses.length) * 100 : 0;

  return (
    <div className="space-y-6 px-6 pb-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">My Expenses</h2>
          <div className="flex items-center space-x-4">
            <span className="text-lg font-medium text-orange-600">
              Pending Payment: ${totalDue.toLocaleString()}
            </span>
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-gray-500" />
              <span className="text-lg font-medium">
                Total: ${totalExpenses.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Payment Progress</span>
            <span>{paidExpenses} of {expenses.length} expenses paid</span>
          </div>
          <Progress 
            value={progressPercentage} 
            className="h-2 bg-yellow-100 [&>div]:bg-green-500" 
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Expense Number</TableHead>
              <TableHead>Expense Name</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Payee</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="font-mono text-sm">
                  {expense.expense_number}
                </TableCell>
                <TableCell className="font-medium">{expense.name}</TableCell>
                <TableCell>{expense.project?.name || 'N/A'}</TableCell>
                <TableCell>{expense.payee}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-1 text-gray-500" />
                    {expense.amount.toLocaleString()}
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge status={expense.payment_status === "paid" ? "paid" : "pending_payment"} />
                </TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(expense.expense_date), { addSuffix: true })}
                </TableCell>
                <TableCell className="text-right">
                  <HomeownerExpenseActions
                    expense={expense}
                    onPaymentSubmit={(data) => handlePaymentSubmit(expense.id, data)}
                    onPaymentSimulate={(data) => handlePaymentSimulation(expense.id, data)}
                  />
                </TableCell>
              </TableRow>
            ))}
            {expenses.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-6 text-gray-500">
                  No expenses found. Click "Add Expense" to create one.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
