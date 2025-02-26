
import { DateRange } from "react-day-picker";

export type ExpenseStatus = "due" | "partially_paid" | "paid" | "all";
export type ExpenseType = "labor" | "materials" | "subcontractor" | "other" | "all";

export interface ExpenseFilters {
  dateRange: DateRange | undefined;
  status: ExpenseStatus;
  projectId: string;
  expenseType: ExpenseType;
}
