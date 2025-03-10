
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { MainNav } from "@/components/navigation/MainNav";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Filter } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { TransactionsTable } from "@/components/admin/transactions/TransactionsTable";
import { useState } from "react";
import { TransactionType } from "@/components/admin/transactions/TransactionFilters";
import { ProjectFilter } from "@/components/shared/filters/ProjectFilter";
import { DateRangeFilter } from "@/components/shared/filters/DateRangeFilter";
import { DateRange } from "react-day-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Expense } from "@/components/project/expense/types";

export default function ExpenseDashboard() {
  const [transactionType, setTransactionType] = useState<TransactionType>('expense');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'partially_paid' | 'due'>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const navigate = useNavigate();

  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses', projectFilter, statusFilter, dateRange],
    queryFn: async () => {
      console.log('Fetching expenses with filters');
      let query = supabase
        .from('expenses')
        .select(`
          id,
          name,
          expense_number,
          amount,
          payee,
          expense_date,
          expense_type,
          payment_status,
          notes,
          project_id,
          amount_due, 
          gc_account_id,
          created_at,
          updated_at,
          project:project_id (name)
        `);

      // Apply project filter
      if (projectFilter !== 'all') {
        query = query.eq('project_id', projectFilter);
      }

      // Apply status filter
      if (statusFilter !== 'all') {
        query = query.eq('payment_status', statusFilter);
      }

      // Apply date range filter
      if (dateRange?.from) {
        query = query.gte('expense_date', dateRange.from.toISOString().split('T')[0]);
        
        if (dateRange.to) {
          query = query.lte('expense_date', dateRange.to.toISOString().split('T')[0]);
        }
      }

      query = query.order('expense_date', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching expenses:', error);
        throw error;
      }
      
      return (data || []) as Expense[];
    },
  });

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      console.log('Fetching invoices');
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          amount,
          status,
          created_at,
          milestones (name),
          projects (name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching invoices:', error);
        throw error;
      }
      
      return data || [];
    },
  });

  const handleExpenseClick = (expenseId: string) => {
    navigate(`/expenses/${expenseId}`);
  };

  const resetFilters = () => {
    setProjectFilter('all');
    setStatusFilter('all');
    setDateRange(undefined);
  };

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <div className="bg-[#172b70] text-white">
        <MainNav />
      </div>
      <div className="container mx-auto px-4 py-8 mt-16 space-y-8">
        {/* Dashboard Header */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <Link to="/dashboard">
              <Button variant="ghost" className="text-gray-600">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-[#172b70]">Expense Dashboard</h1>
            <p className="text-gray-600">Track and manage all expense transactions</p>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-6 shadow-sm border-0">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-600" />
                <h3 className="font-medium">Filters</h3>
              </div>
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Reset Filters
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Project</label>
                <ProjectFilter value={projectFilter} onChange={setProjectFilter} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | 'paid' | 'partially_paid' | 'due')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="partially_paid">Partially Paid</SelectItem>
                    <SelectItem value="due">Pending Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Date Range</label>
                <DateRangeFilter dateRange={dateRange} onDateRangeChange={setDateRange} />
              </div>
            </div>
          </div>
        </Card>

        <Card className="shadow-sm border-0">
          <TransactionsTable 
            transactionType={transactionType} 
            invoices={invoices} 
            expenses={expenses} 
            onExpenseClick={handleExpenseClick}
            isLoading={expensesLoading || invoicesLoading}
          />
        </Card>
      </div>
    </div>
  );
}
