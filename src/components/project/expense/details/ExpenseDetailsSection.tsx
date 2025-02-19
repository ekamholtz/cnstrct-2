
import { Card } from "@/components/ui/card";
import { Expense } from "../types";
import { format } from "date-fns";

interface ExpenseDetailsSectionProps {
  expense: Expense & { project: { name: string } };
}

export function ExpenseDetailsSection({ expense }: ExpenseDetailsSectionProps) {
  const statusColors = {
    due: "bg-yellow-100 text-yellow-800",
    partially_paid: "bg-blue-100 text-blue-800",
    paid: "bg-green-100 text-green-800",
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Expense Details</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Name</label>
            <p className="mt-1 text-gray-900">{expense.name}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500">Amount</label>
            <p className="mt-1 text-gray-900">${expense.amount.toFixed(2)}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500">Payee</label>
            <p className="mt-1 text-gray-900">{expense.payee}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500">Date</label>
            <p className="mt-1 text-gray-900">
              {format(new Date(expense.expense_date), 'MMMM d, yyyy')}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Expense Type</label>
            <p className="mt-1 text-gray-900 capitalize">{expense.expense_type}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500">Project</label>
            <p className="mt-1 text-gray-900">{expense.project.name}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500">Payment Status</label>
            <p className={`mt-1 inline-flex px-2 py-1 rounded-full text-sm ${statusColors[expense.payment_status]}`}>
              {expense.payment_status.replace('_', ' ')}
            </p>
          </div>

          {expense.notes && (
            <div>
              <label className="text-sm font-medium text-gray-500">Notes</label>
              <p className="mt-1 text-gray-900">{expense.notes}</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
