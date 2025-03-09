
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { MainNav } from "@/components/navigation/MainNav";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { TransactionsTable } from "@/components/admin/transactions/TransactionsTable";
import { useState } from "react";
import { TransactionType } from "@/components/admin/transactions/TransactionFilters";

export default function ExpenseDashboard() {
  const [transactionType, setTransactionType] = useState<TransactionType>('expense');
  const navigate = useNavigate();

  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      console.log('Fetching expenses');
      const { data, error } = await supabase
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
          projects (name)
        `)
        .order('expense_date', { ascending: false });

      if (error) {
        console.error('Error fetching expenses:', error);
        throw error;
      }
      
      return data || [];
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
