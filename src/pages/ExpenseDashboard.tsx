
import { useAllHomeownerExpenses } from "@/components/homeowner/expenses/hooks/useAllHomeownerExpenses";
import { HomeownerExpenseList } from "@/components/homeowner/expenses/HomeownerExpenseList";

export default function ExpenseDashboard() {
  const { expenses, isLoading } = useAllHomeownerExpenses();

  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-semibold">My Expenses</h1>
        </div>
        
        <HomeownerExpenseList
          expenses={expenses || []}
          loading={isLoading}
          showProject={true}  // New prop to show project column in the list
        />
      </div>
    </div>
  );
}
