
import { useAllHomeownerExpenses } from "@/components/homeowner/expenses/hooks/useAllHomeownerExpenses";
import { HomeownerExpenseList } from "@/components/homeowner/expenses/HomeownerExpenseList";
import { MainNav } from "@/components/navigation/MainNav";
import { DollarSign, Receipt, Activity } from "lucide-react";
import { MetricsCard } from "@/components/project/dashboard/MetricsCard";

export default function ExpenseDashboard() {
  const { expenses, isLoading } = useAllHomeownerExpenses();

  // Calculate metrics
  const totalExpenses = expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
  const paidExpenses = expenses?.reduce((sum, exp) => 
    exp.payment_status === "paid" ? sum + exp.amount : sum, 0) || 0;
  const pendingExpenses = totalExpenses - paidExpenses;
  const progressPercentage = totalExpenses > 0 
    ? Math.round((paidExpenses / totalExpenses) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <div className="bg-[#172b70] text-white">
        <MainNav />
      </div>
      <div className="container mx-auto px-4 py-8 mt-16 space-y-8">
        {/* Header */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-[#172b70] mb-2">My Expenses Dashboard</h1>
          <div className="text-gray-600">
            Manage and track all your project-related expenses
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricsCard
            icon={DollarSign}
            label="Total Expenses"
            value={totalExpenses}
            breakdownItems={[
              { label: 'Paid', value: paidExpenses },
              { label: 'Pending', value: pendingExpenses }
            ]}
            progress={(paidExpenses / totalExpenses) * 100}
          />
          <MetricsCard
            icon={Receipt}
            label="Payment Status"
            value={paidExpenses}
            breakdownItems={[
              { label: 'To Pay', value: pendingExpenses }
            ]}
            progress={(paidExpenses / totalExpenses) * 100}
          />
          <MetricsCard
            icon={Activity}
            label="Completion Rate"
            value={`${progressPercentage}%`}
            progress={progressPercentage}
            useCircularProgress
          />
        </div>

        {/* Expenses List */}
        <div className="bg-white rounded-lg shadow-sm">
          <HomeownerExpenseList
            expenses={expenses || []}
            loading={isLoading}
            showProject={true}
          />
        </div>
      </div>
    </div>
  );
}
