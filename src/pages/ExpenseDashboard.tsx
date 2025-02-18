
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ExpenseList } from "@/components/project/expense/ExpenseList";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Expense } from "@/components/project/expense/types";
import { ExpenseForm } from "@/components/project/expense/ExpenseForm";
import { useToast } from "@/hooks/use-toast";

export default function ExpenseDashboard() {
  const { toast } = useToast();

  // Fetch user profile
  const { data: profile } = useQuery({
    queryKey: ['contractor-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('profiles')
        .select('company_name, full_name')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Fetch all expenses for the current contractor
  const { data: expenses = [], isLoading, refetch } = useQuery({
    queryKey: ['contractor-expenses'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          project:projects(name)
        `)
        .eq('contractor_id', user.id)
        .order('expense_date', { ascending: false });

      if (error) throw error;
      return data as (Expense & { project: { name: string } })[];
    },
  });

  const handleCreateExpense = async (data: any, status: 'due' | 'paid' | 'partially_paid') => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user found');

    const paymentStatus = status === 'due' ? 'DUE' : 
                         status === 'paid' ? 'PAID' : 
                         'PARTIALLY_PAID';

    const { error } = await supabase
      .from('expenses')
      .insert({
        ...data,
        amount: Number(data.amount),
        contractor_id: user.id,
        payment_status: paymentStatus
      });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create expense. Please try again.",
      });
      throw error;
    }

    toast({
      title: "Success",
      description: "Expense has been created",
    });
    refetch();
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <div className="flex items-center justify-between mb-8">
            <Link to="/dashboard">
              <Button variant="ghost" className="text-gray-600">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <ExpenseForm onSubmit={handleCreateExpense} />
          </div>

          <div className="space-y-1">
            <p className="text-xl font-bold text-gray-700">
              {profile?.company_name || profile?.full_name}
            </p>
            <h1 className="text-2xl font-bold text-gray-900">Expense Dashboard</h1>
            <p className="text-gray-600">Track and manage all project expenses</p>
          </div>
        </div>

        <ExpenseList 
          expenses={expenses} 
          loading={isLoading} 
          showProjectName 
        />
      </div>
    </DashboardLayout>
  );
}
