
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminNav } from "@/components/admin/AdminNav";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

type TransactionType = 'all' | 'invoice' | 'expense';
type TransactionStatus = 'all' | 'pending_payment' | 'paid';

const AdminTransactions = () => {
  const [transactionType, setTransactionType] = useState<TransactionType>('all');
  const [statusFilter, setStatusFilter] = useState<TransactionStatus>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');

  // Fetch projects for filter dropdown
  const { data: projects } = useQuery({
    queryKey: ['admin-projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name');
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch invoices
  const { data: invoices = [] } = useQuery({
    queryKey: ['admin-invoices', statusFilter, projectFilter],
    queryFn: async () => {
      let query = supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          amount,
          status,
          created_at,
          project_id,
          milestone_id,
          milestones (
            name
          ),
          projects (
            name
          )
        `);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      if (projectFilter !== 'all') {
        query = query.eq('project_id', projectFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: transactionType === 'all' || transactionType === 'invoice'
  });

  // Fetch expenses
  const { data: expenses = [] } = useQuery({
    queryKey: ['admin-expenses', projectFilter],
    queryFn: async () => {
      let query = supabase
        .from('expenses')
        .select(`
          id,
          name,
          payee,
          amount,
          expense_date,
          notes,
          project_id,
          projects (
            name
          )
        `);

      if (projectFilter !== 'all') {
        query = query.eq('project_id', projectFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: transactionType === 'all' || transactionType === 'expense'
  });

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
    <div className="flex flex-col min-h-screen bg-gray-50">
      <AdminNav />
      <div className="flex-1 container mx-auto p-6 mt-16">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Transaction Oversight</h1>
        </div>

        <Card className="mb-6">
          <div className="p-4 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <Select value={transactionType} onValueChange={(value) => setTransactionType(value as TransactionType)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Transaction type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Transactions</SelectItem>
                  <SelectItem value="invoice">Invoices Only</SelectItem>
                  <SelectItem value="expense">Expenses Only</SelectItem>
                </SelectContent>
              </Select>

              {(transactionType === 'all' || transactionType === 'invoice') && (
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as TransactionStatus)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending_payment">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              )}

              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

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
      </div>
    </div>
  );
};

export default AdminTransactions;
