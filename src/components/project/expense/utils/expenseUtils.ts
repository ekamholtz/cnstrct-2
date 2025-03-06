
import { format } from 'date-fns';

// Utility to validate expense data before submission
export function validateExpenseData(data: any): string | null {
  if (!data.name || data.name.trim() === '') {
    return 'Expense name is required';
  }
  
  if (!data.amount || isNaN(Number(data.amount)) || Number(data.amount) <= 0) {
    return 'Amount must be a positive number';
  }
  
  if (!data.payee || data.payee.trim() === '') {
    return 'Payee is required';
  }
  
  if (!data.expense_date) {
    return 'Expense date is required';
  }
  
  if (!data.expense_type) {
    return 'Expense type is required';
  }
  
  if (!data.project_id) {
    return 'Project ID is required';
  }
  
  return null;
}

// Generate a formatted expense number based on the current date and a random suffix
export function generateExpenseNumber(): string {
  const datePrefix = format(new Date(), 'yyyyMMdd');
  const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `EXP-${datePrefix}-${randomSuffix}`;
}
