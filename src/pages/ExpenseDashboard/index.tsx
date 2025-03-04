
import { MainNav } from "@/components/navigation/MainNav";
import { Card } from "@/components/ui/card";
import { HomeownerExpenseList } from "@/components/homeowner/expenses/HomeownerExpenseList";
import { DashboardHeader } from "./components/DashboardHeader";
import { ExpenseFilters } from "./components/ExpenseFilters";
import { useExpenseDashboard } from "./hooks/useExpenseDashboard";
import { useCurrentUserProfile } from "@/components/gc-profile/hooks/useCurrentUserProfile";
import { ExpenseList } from "@/components/project/expense/ExpenseList";

export default function ExpenseDashboard() {
  const {
    filters,
    setFilters,
    expenses,
    isLoading,
    handleCreateExpense,
  } = useExpenseDashboard();

  const { currentUserProfile } = useCurrentUserProfile();
  const isHomeowner = currentUserProfile?.role === 'homeowner';

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <div className="bg-[#172b70] text-white">
        <MainNav />
      </div>
      <div className="container mx-auto px-4 py-8 mt-16 space-y-8">
        <DashboardHeader 
          onCreateExpense={handleCreateExpense}
          defaultProjectId={filters.projectId !== 'all' ? filters.projectId : undefined}
        />
        <ExpenseFilters 
          filters={filters}
          onFiltersChange={setFilters}
        />
        <Card className="shadow-sm border-0">
          {isHomeowner ? (
            <HomeownerExpenseList
              expenses={expenses as any[] || []}
              loading={isLoading}
              showProject={true}
            />
          ) : (
            <ExpenseList expenses={expenses as any[] || []} />
          )}
        </Card>
      </div>
    </div>
  );
}
