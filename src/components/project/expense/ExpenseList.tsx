
import { formatDistanceToNow } from "date-fns";
import { DollarSign, Building2, Calendar } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Expense } from "./types";
import { Skeleton } from "@/components/ui/skeleton";

interface ExpenseListProps {
  expenses: (Expense & { project?: { name: string } })[];
  loading?: boolean;
  showProjectName?: boolean;
}

export function ExpenseList({ expenses, loading, showProjectName }: ExpenseListProps) {
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Project Expenses</h2>
        <div className="flex items-center space-x-2">
          <DollarSign className="h-5 w-5 text-gray-500" />
          <span className="text-lg font-medium">
            Total: ${totalExpenses.toLocaleString()}
          </span>
        </div>
      </div>
      
      <div className="grid gap-4">
        {expenses.map((expense) => (
          <Card key={expense.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{expense.name}</CardTitle>
                  <CardDescription>
                    Paid to: {expense.payee}
                  </CardDescription>
                </div>
                <span className="font-semibold text-lg">
                  ${expense.amount.toLocaleString()}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {formatDistanceToNow(new Date(expense.expense_date), { addSuffix: true })}
                  </span>
                </div>
                {showProjectName && expense.project && (
                  <div className="flex items-center space-x-1">
                    <Building2 className="h-4 w-4" />
                    <span>{expense.project.name}</span>
                  </div>
                )}
                <div>
                  <span className="font-medium">Type:</span>{" "}
                  {expense.expense_type.toUpperCase()}
                </div>
                <div>
                  <span className="font-medium">Status:</span>{" "}
                  {expense.payment_status.replace('_', ' ').toUpperCase()}
                </div>
                {expense.notes && (
                  <div className="col-span-2 mt-2">
                    <span className="font-medium">Notes:</span>{" "}
                    {expense.notes}
                  </div>
                )}
                {expense.payments && expense.payments.length > 0 && (
                  <div className="col-span-2 mt-2">
                    <span className="font-medium">Latest Payment:</span>{" "}
                    ${expense.payments[0].payment_amount.toLocaleString()} via{" "}
                    {expense.payments[0].payment_type.toUpperCase()}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
