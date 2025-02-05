
import { formatDistanceToNow } from "date-fns";
import { DollarSign } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Expense } from "./types";

interface ExpenseListProps {
  expenses: Expense[];
}

export function ExpenseList({ expenses }: ExpenseListProps) {
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

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
                <div>
                  <span className="font-medium">Payment Type:</span>{" "}
                  {expense.payment_type.toUpperCase()}
                </div>
                <div>
                  <span className="font-medium">Date:</span>{" "}
                  {formatDistanceToNow(new Date(expense.expense_date), { addSuffix: true })}
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
      </div>
    </div>
  );
}
