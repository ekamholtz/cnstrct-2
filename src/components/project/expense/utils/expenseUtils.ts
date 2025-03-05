
/**
 * Generates a unique expense number with timestamp and random string
 */
export const generateExpenseNumber = (): string => {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 5);
  return `EXP-${timestamp}-${randomStr}`.toUpperCase();
};

/**
 * Formats expense type for display
 */
export const formatExpenseType = (type: string): string => {
  return type.charAt(0).toUpperCase() + type.slice(1);
};

/**
 * Validates expense data
 */
export const validateExpenseData = (data: any): string | null => {
  if (!data.name || data.name.trim() === '') {
    return 'Expense name is required';
  }
  
  if (!data.amount || isNaN(Number(data.amount)) || Number(data.amount) <= 0) {
    return 'Valid expense amount is required';
  }
  
  if (!data.payee || data.payee.trim() === '') {
    return 'Payee is required';
  }
  
  if (!data.expense_date) {
    return 'Expense date is required';
  }
  
  if (!data.project_id) {
    return 'Project ID is required';
  }
  
  return null;
};
