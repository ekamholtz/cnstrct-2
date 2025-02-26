
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MainNav } from "@/components/navigation/MainNav";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { DateRange } from "react-day-picker";
import { DateRangeFilter } from "@/components/shared/filters/DateRangeFilter";
import { ProjectFilter } from "@/components/shared/filters/ProjectFilter";
import { Expense } from "@/components/project/expense/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HomeownerExpenseList } from "@/components/homeowner/expenses/HomeownerExpenseList";

type ExpenseStatus = "due" | "partially_paid" | "paid" | "all";
type ExpenseType = "labor" | "materials" | "subcontractor" | "other" | "all";

interface ExpenseFilters {
  dateRange: DateRange | undefined;
  status: ExpenseStatus;
  projectId: string;
  expenseType: ExpenseType;
}

export default function ExpenseDashboard() {
  const [filters, setFilters] = useState<ExpenseFilters>({
    dateRange: undefined,
    status: "all",
    projectId: "all",
    expenseType: "all"
  });

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expenses', filters],
    queryFn: async () => {
      let query = supabase
        .from('expenses')
        .select(`
          *,
          project:project_id (
            name
          )
        `);

      if (filters.status !== 'all') {
        query = query.eq('payment_status', filters.status);
      }
      if (filters.projectId !== 'all') {
        query = query.eq('project_id', filters.projectId);
      }
      if (filters.expenseType !== 'all') {
        query = query.eq('expense_type', filters.expenseType);
      }
      if (filters.dateRange?.from) {
        query = query.gte('expense_date', filters.dateRange.from.toISOString());
      }
      if (filters.dateRange?.to) {
        query = query.lte('expense_date', filters.dateRange.to.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Expense[];
    },
  });

  // Transform expenses to match HomeownerExpenseList expected format
  const transformedExpenses = expenses?.map(expense => ({
    id: expense.id,
    amount: expense.amount,
    amount_due: expense.amount_due,
    expense_date: expense.expense_date,
    expense_type: expense.expense_type,
    payment_status: expense.payment_status,
    created_at: expense.created_at,
    updated_at: expense.updated_at || expense.created_at,
    payee: expense.payee,
    notes: expense.notes,
    expense_number: expense.id, // Using ID as expense number since we don't have one
    name: expense.name,
    project_id: expense.project_id,
    homeowner_id: expense.contractor_id, // Using contractor_id as homeowner_id
    project: expense.project
  })) || [];

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
            <h1 className="text-2xl font-bold text-[#172b70]">Expenses Dashboard</h1>
            <p className="text-gray-600">Track and manage all project expenses</p>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-6 shadow-sm border-0">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select
              value={filters.expenseType}
              onValueChange={(value: ExpenseType) => setFilters({ ...filters, expenseType: value })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Expense Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="labor">Labor</SelectItem>
                <SelectItem value="materials">Materials</SelectItem>
                <SelectItem value="subcontractor">Subcontractor</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.status}
              onValueChange={(value: ExpenseStatus) => setFilters({ ...filters, status: value })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="due">Due</SelectItem>
                <SelectItem value="partially_paid">Partially Paid</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>

            <DateRangeFilter
              dateRange={filters.dateRange}
              onDateRangeChange={(range) => setFilters({ ...filters, dateRange: range })}
            />

            <ProjectFilter
              value={filters.projectId}
              onChange={(value) => setFilters({ ...filters, projectId: value })}
            />

            <Button
              variant="ghost"
              onClick={() => setFilters({
                dateRange: undefined,
                status: "all",
                projectId: "all",
                expenseType: "all"
              })}
            >
              Reset Filters
            </Button>
          </div>
        </Card>

        {/* Expense List */}
        <Card className="shadow-sm border-0">
          <HomeownerExpenseList
            expenses={transformedExpenses}
            loading={isLoading}
            showProject={true}
          />
        </Card>
      </div>
    </div>
  );
}
