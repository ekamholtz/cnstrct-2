
import { formatDistanceToNow } from "date-fns";
import { DollarSign, Calendar, Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HomeownerExpense } from "./types";
import { Skeleton } from "@/components/ui/skeleton";

interface HomeownerExpenseListProps {
  expenses: (HomeownerExpense & { project?: { name: string } })[];
  loading?: boolean;
}

export function HomeownerExpenseList({ expenses, loading }: HomeownerExpenseListProps) {
  const totalExpenses = expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
  const totalDue = expenses?.reduce((sum, exp) => sum + exp.amount_due, 0) || 0;

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-1/3" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500';
      case 'partially_paid':
        return 'bg-yellow-500';
      default:
        return 'bg-red-500';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-semibold">My Expenses</h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-gray-500" />
            <span className="text-lg font-medium">
              Total: ${totalExpenses.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Receipt className="h-5 w-5 text-red-500" />
            <span className="text-lg font-medium text-red-600">
              Due: ${totalDue.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
      
      <div className="grid gap-4">
        {expenses?.map((expense) => (
          <Card key={expense.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{expense.name}</CardTitle>
                    <Badge 
                      className={`${getStatusColor(expense.payment_status)} text-white`}
                    >
                      {expense.payment_status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-500">
                    Paid to: {expense.payee}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-lg">
                    ${expense.amount.toLocaleString()}
                  </div>
                  {expense.amount_due > 0 && (
                    <div className="text-sm text-red-600">
                      Due: ${expense.amount_due.toLocaleString()}
                    </div>
                  )}
                </div>
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
                {expense.project && (
                  <div className="flex items-center space-x-1">
                    <span>Project: {expense.project.name}</span>
                  </div>
                )}
                <div>
                  <span className="font-medium">Type:</span>{" "}
                  {expense.expense_type.toUpperCase()}
                </div>
                {expense.notes && (
                  <div className="col-span-2 mt-2">
                    <span className="font-medium">Notes:</span>{" "}
                    {expense.notes}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {(!expenses || expenses.length === 0) && (
          <div className="text-center text-gray-500 py-8">
            No expenses found. Click "Add Expense" to create one.
          </div>
        )}
      </div>
    </div>
  );
}
