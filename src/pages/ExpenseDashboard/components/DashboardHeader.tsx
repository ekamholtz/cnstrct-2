
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ExpenseForm } from "@/components/project/expense/ExpenseForm";
import type { ExpenseFormStage1Data, PaymentDetailsData } from "@/components/project/expense/types";

interface DashboardHeaderProps {
  onCreateExpense: (
    data: ExpenseFormStage1Data,
    status: 'due' | 'paid' | 'partially_paid',
    paymentDetails?: PaymentDetailsData
  ) => Promise<void>;
  defaultProjectId?: string;
}

export function DashboardHeader({ onCreateExpense, defaultProjectId }: DashboardHeaderProps) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <Link to="/dashboard">
          <Button variant="ghost" className="text-gray-600">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <ExpenseForm 
          onSubmit={onCreateExpense}
          defaultProjectId={defaultProjectId}
        />
      </div>
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-[#172b70]">Expenses Dashboard</h1>
        <p className="text-gray-600">Track and manage all project expenses</p>
      </div>
    </div>
  );
}
