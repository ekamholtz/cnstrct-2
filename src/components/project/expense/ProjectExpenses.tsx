
import { ExpenseList } from "./ExpenseList";
import { ExpenseForm } from "./ExpenseForm";
import type { Expense } from "./types";

interface ProjectExpensesProps {
  projectId: string;
  expenses: Expense[];
}

export function ProjectExpenses({ projectId, expenses }: ProjectExpensesProps) {
  return (
    <div className="space-y-8">
      <ExpenseForm defaultProjectId={projectId} />
      <ExpenseList expenses={expenses} />
    </div>
  );
}
