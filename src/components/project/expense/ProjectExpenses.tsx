
import { ExpenseForm } from "./ExpenseForm";
import { ExpenseList } from "./ExpenseList";
import { useExpenses } from "./hooks/useExpenses";
import type { ExpenseFormData } from "./types";

interface ProjectExpensesProps {
  projectId: string;
}

export function ProjectExpenses({ projectId }: ProjectExpensesProps) {
  const { expenses, isLoading, createExpense } = useExpenses(projectId);

  const handleCreateExpense = async (data: ExpenseFormData, paymentAction: 'save_as_paid' | 'pay') => {
    await createExpense(data);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ExpenseForm onSubmit={handleCreateExpense} defaultProjectId={projectId} />
      </div>
      <ExpenseList expenses={expenses} />
    </div>
  );
}
