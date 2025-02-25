
import { useHomeownerExpenses } from "./hooks/useHomeownerExpenses";
import { HomeownerExpenseForm } from "./HomeownerExpenseForm";
import { HomeownerExpenseList } from "./HomeownerExpenseList";

interface HomeownerExpensesProps {
  projectId: string;
}

export function HomeownerExpenses({ projectId }: HomeownerExpensesProps) {
  const { expenses, isLoading, createExpense } = useHomeownerExpenses(projectId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold">Project Expenses</h1>
        <HomeownerExpenseForm
          projectId={projectId}
          onSubmit={createExpense}
        />
      </div>
      <HomeownerExpenseList
        expenses={expenses || []}
        loading={isLoading}
      />
    </div>
  );
}
