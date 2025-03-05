
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
  console.log('Validating expense data:', data);
  
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

/**
 * Gets a user-friendly error message from Supabase error
 */
export const getErrorMessage = (error: any): string => {
  // Handle RLS policy violations
  if (error?.code === '42501') {
    return "Permission denied: You don't have access to perform this action. Please check your permissions.";
  }
  
  // Handle foreign key violations
  if (error?.code === '23503') {
    return "Database error: Related record not found. Make sure the project exists.";
  }
  
  // Handle not null constraint violations
  if (error?.code === '23502') {
    const column = error.message?.match(/column "(.*?)" of relation/)?.[1] || 'field';
    return `${column.charAt(0).toUpperCase() + column.slice(1)} is required.`;
  }
  
  // Handle unique constraint violations
  if (error?.code === '23505') {
    return "This record already exists. Please use a unique value.";
  }
  
  // Handle check constraint violations
  if (error?.code === '23514') {
    return "One or more values don't meet the requirements. Please check your input.";
  }
  
  // Handle generic DB errors with user-friendly messages
  if (error?.code?.startsWith('23')) {
    return "Database error: The data couldn't be saved. Please check your input and try again.";
  }
  
  // Return the error message or a default
  return error?.message || "An unknown error occurred. Please try again.";
};

/**
 * Logs detailed user and project information for debugging
 */
export const logAuthContext = (userProfile: any, projectData: any): void => {
  console.log('Auth context:', {
    user: {
      id: userProfile?.id,
      role: userProfile?.role,
      gcAccountId: userProfile?.gc_account_id,
    },
    project: {
      id: projectData?.id,
      pmUserId: projectData?.pm_user_id,
      contractorId: projectData?.contractor_id,
      gcAccountId: projectData?.gc_account_id,
    },
    isPM: userProfile?.id === projectData?.pm_user_id,
    isGcAdmin: userProfile?.role === 'gc_admin' && userProfile?.gc_account_id === projectData?.gc_account_id,
    isPlatformAdmin: userProfile?.role === 'platform_admin',
  });
};
