
/**
 * Helper function to extract detailed information from errors
 */
export function getErrorDetails(error: any): string {
  if (!error) return "Unknown error";
  
  // Extract message from different error formats
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  if (error.error) return typeof error.error === 'string' ? error.error : JSON.stringify(error.error);
  
  // Handle Supabase specific error formats
  if (error.code && error.details) {
    return `${error.message || 'Error'} (${error.code}): ${error.details}`;
  }
  
  return JSON.stringify(error);
}
