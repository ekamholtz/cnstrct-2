
import { useHomeownerExpenses } from "./hooks/useHomeownerExpenses";
import { HomeownerExpenseForm } from "./HomeownerExpenseForm";
import { HomeownerExpenseList } from "./HomeownerExpenseList";
import { HomeownerExpenseFormFields } from "./types";

interface HomeownerExpensesProps {
  projectId: string;
}

export function HomeownerExpenses({ projectId }: HomeownerExpensesProps) {
  const { expenses, isLoading, createExpense } = useHomeownerExpenses(projectId);

  const handleCreateExpense = async (data: HomeownerExpenseFormFields) => {
    await createExpense(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold">Project Expenses</h1>
        <HomeownerExpenseForm
          projectId={projectId}
          onSubmit={handleCreateExpense}
        />
      </div>
      <HomeownerExpenseList
        expenses={expenses || []}
        loading={isLoading}
        projectId={projectId}
      />
    </div>
  );
}
