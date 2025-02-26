import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MainNav } from "@/components/navigation/MainNav";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { DateRange } from "react-day-picker";
import { DateRangeFilter } from "@/components/shared/filters/DateRangeFilter";
import { ProjectFilter } from "@/components/shared/filters/ProjectFilter";
import { HomeownerExpenseList } from "@/components/homeowner/expenses/HomeownerExpenseList";
import { ExpenseForm } from "@/components/project/expense/ExpenseForm";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ExpenseFormStage1Data, PaymentDetailsData } from "@/components/project/expense/types";

type ExpenseStatus = "due" | "partially_paid" | "paid" | "all";
type ExpenseType = "labor" | "materials" | "subcontractor" | "other" | "all";

interface ExpenseFilters {
  dateRange: DateRange | undefined;
  status: ExpenseStatus;
  projectId: string;
  expenseType: ExpenseType;
}

export default function ExpenseDashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
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
        .from('homeowner_expenses')
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
      return data;
    },
  });

  const handleCreateExpense = async (
    data: ExpenseFormStage1Data,
    status: 'due' | 'paid' | 'partially_paid',
    paymentDetails?: PaymentDetailsData
  ): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { error } = await supabase
        .from('homeowner_expenses')
        .insert({
          ...data,
          amount: parseFloat(data.amount),
          homeowner_id: user.id,
          payment_status: status,
          amount_due: parseFloat(data.amount)
        });

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['expenses'] });

      toast({
        title: "Success",
        description: "Expense created successfully",
      });
    } catch (error) {
      console.error('Error creating expense:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create expense. Please try again.",
      });
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <div className="bg-[#172b70] text-white">
        <MainNav />
      </div>
      <div className="container mx-auto px-4 py-8 mt-16 space-y-8">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <Link to="/dashboard">
              <Button variant="ghost" className="text-gray-600">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <ExpenseForm onSubmit={handleCreateExpense} defaultProjectId={filters.projectId !== 'all' ? filters.projectId : undefined}>
              <Button className="bg-[#9b87f5] hover:bg-[#7E69AB]">
                <Plus className="mr-2 h-4 w-4" />
                Create New Expense
              </Button>
            </ExpenseForm>
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-[#172b70]">Expenses Dashboard</h1>
            <p className="text-gray-600">Track and manage all project expenses</p>
          </div>
        </div>

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

        <Card className="shadow-sm border-0">
          <HomeownerExpenseList
            expenses={expenses || []}
            loading={isLoading}
            showProject={true}
          />
        </Card>
      </div>
    </div>
  );
}
