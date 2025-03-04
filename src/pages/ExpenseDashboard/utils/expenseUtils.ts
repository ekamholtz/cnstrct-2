
/**
 * Generates a unique expense number with timestamp and random string
 */
export const generateExpenseNumber = (): string => {
  return `EXP-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`.toUpperCase();
};
