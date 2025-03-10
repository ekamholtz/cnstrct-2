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
import type { Expense as ExpenseType } from "./types";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";

interface ExpenseListProps {
  expenses: ExpenseType[]; 
  loading?: boolean;
  showProjectName?: boolean;
}

interface Expense {
  id?: string;
  name?: string;
  payee?: string;
  amount?: number | string;
  payment_status?: string;
  expense_date?: string;
  created_at?: string;
  payments?: {
    amount?: number | string;
  }[];
}

const mapExpenseStatusToInvoiceStatus = (status: string): "paid" | "pending_payment" | "cancelled" => {
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

const safeGet = (obj: any, path: string, defaultValue: any = undefined) => {
  try {
    return path.split('.').reduce((o, p) => (o ? o[p] : defaultValue), obj);
  } catch (e) {
    return defaultValue;
  }
};

export function ExpenseList({ expenses = [], loading = false }: ExpenseListProps) {
  const navigate = useNavigate();
  
  // Ensure expenses is always a valid array with valid objects
  const safeExpenses = Array.isArray(expenses) 
    ? expenses.filter(exp => exp && typeof exp === 'object') 
    : [];
  
  const totalExpenses = safeExpenses.reduce((sum, exp) => {
    const amount = typeof exp?.amount === 'number' ? exp.amount : 
                  (typeof exp?.amount === 'string' ? parseFloat(exp.amount) || 0 : 0);
    return sum + amount;
  }, 0);
  
  const totalPaid = safeExpenses.reduce((sum, exp) => {
    // Safely handle payments that might be null, undefined, or not an array
    const payments = Array.isArray(exp?.payments) ? exp.payments : [];
    const paymentSum = payments.reduce((pSum, p) => {
      // Handle potential null or undefined payment objects
      if (!p || typeof p !== 'object') return pSum;
      
      const amount = typeof p.amount === 'number' ? p.amount : 
                    (typeof p.amount === 'string' ? parseFloat(p.amount) || 0 : 0);
      return pSum + amount;
    }, 0);
    return sum + paymentSum;
  }, 0);

  // Count expenses with payment_status = 'paid'
  const paidCount = safeExpenses.filter(exp => exp?.payment_status === 'paid').length;
  const totalCount = safeExpenses.length;

  const handleRowClick = (expenseId: string) => {
    navigate(`/expenses/${expenseId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (safeExpenses.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-500">
        No expenses found.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6">
        <div className="flex flex-col md:flex-row justify-between mb-6">
          <div className="mb-4 md:mb-0">
            <h3 className="text-lg font-semibold text-gray-900">Expenses</h3>
            <p className="text-sm text-gray-500">
              {totalCount} expense{totalCount !== 1 ? 's' : ''} total
            </p>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 mr-4">Payment Progress:</span>
              <span className="text-sm font-medium">
                {paidCount} of {totalCount} paid
              </span>
            </div>
            <Progress 
              value={totalCount > 0 ? (paidCount / totalCount) * 100 : 0} 
              className="h-2 w-full md:w-64" 
              indicatorClassName="bg-green-500"
            />
          </div>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Expense #</TableHead>
            <TableHead>Payee / Description</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {safeExpenses.map((expense) => {
            const id = expense?.id || `expense-${Math.random().toString(36).substr(2, 9)}`;
            const name = expense?.name || 'Unnamed Expense';
            const payee = expense?.payee || 'Unknown';
            const amount = typeof expense?.amount === 'number' ? expense.amount : 0;
            const status = expense?.payment_status || 'due';
            const date = expense?.expense_date || expense?.created_at || new Date().toISOString();
            const expenseNumber = expense?.expense_number || 'N/A';
            const projectName = safeGet(expense, 'project.name', 'Unknown Project');
            const expenseType = expense?.expense_type || 'other';
            
            // Format expense type for display
            const formatExpenseType = (type: string) => {
              switch(type) {
                case 'labor': return 'Labor';
                case 'materials': return 'Materials';
                case 'subcontractor': return 'Subcontractor';
                case 'other': return 'Other';
                default: return type.charAt(0).toUpperCase() + type.slice(1);
              }
            };
            
            return (
              <TableRow 
                key={id} 
                onClick={() => handleRowClick(id)}
                className="cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <TableCell className="font-medium">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{expenseNumber}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-base">{payee}</span>
                    <span className="text-xs text-gray-500 mt-1">{name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="max-w-[150px] truncate" title={projectName}>
                    {projectName}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {formatExpenseType(expenseType)}
                  </div>
                </TableCell>
                <TableCell>${amount.toFixed(2)}</TableCell>
                <TableCell>
                  <div className="flex flex-col space-y-1">
                    <StatusBadge status={mapExpenseStatusToInvoiceStatus(status)} />
                    <div className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(date), { addSuffix: true })}
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
