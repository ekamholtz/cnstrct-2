
import { formatDistanceToNow } from "date-fns";
import { DollarSign, Building2, Calendar, CreditCard, Receipt, Clock } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import type { Expense } from "./types";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";

interface ExpenseListProps {
  expenses: (Expense & { project?: { name: string } })[];
  loading?: boolean;
  showProjectName?: boolean;
}

export function ExpenseList({ expenses, loading, showProjectName }: ExpenseListProps) {
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalPaid = expenses.reduce((sum, exp) => {
    return sum + (exp.payments?.reduce((pSum, p) => pSum + p.payment_amount, 0) ?? 0);
  }, 0);

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
        <h2 className="text-2xl font-semibold">Project Expenses</h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-gray-500" />
            <span className="text-lg font-medium">
              Total: ${totalExpenses.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Receipt className="h-5 w-5 text-green-500" />
            <span className="text-lg font-medium text-green-600">
              Paid: ${totalPaid.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
      
      <div className="grid gap-4">
        {expenses.map((expense) => (
          <Link 
            key={expense.id} 
            to={`/expenses/${expense.id}`}
            className="block transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-lg"
          >
            <Card>
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
                    <CardDescription>
                      Paid to: {expense.payee}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-lg">
                      ${expense.amount.toLocaleString()}
                    </span>
                    {expense.payments && expense.payments.length > 0 && (
                      <div className="text-sm text-green-600">
                        Paid: ${expense.payments.reduce((sum, p) => sum + p.payment_amount, 0).toLocaleString()}
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
                  {expense.notes && (
                    <div className="col-span-2 mt-2">
                      <span className="font-medium">Notes:</span>{" "}
                      {expense.notes}
                    </div>
                  )}
                  {expense.payments && expense.payments.length > 0 && (
                    <div className="col-span-2 mt-4">
                      <Accordion type="single" collapsible>
                        <AccordionItem value="payments">
                          <AccordionTrigger>
                            Payment History ({expense.payments.length})
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-3">
                              {expense.payments.map((payment) => (
                                <div 
                                  key={payment.id} 
                                  className="flex items-center justify-between p-2 bg-gray-50 rounded"
                                >
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <CreditCard className="h-4 w-4 text-gray-500" />
                                      <span className="font-medium">
                                        ${payment.payment_amount.toLocaleString()}
                                      </span>
                                      <span className="text-gray-500">
                                        via {payment.payment_type.toUpperCase()}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-500">
                                      <Clock className="h-4 w-4" />
                                      <span>
                                        {formatDistanceToNow(new Date(payment.payment_date), { addSuffix: true })}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
