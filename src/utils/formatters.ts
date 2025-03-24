/**
 * Utility functions for consistent data formatting throughout the application
 */

/**
 * Format a number as currency (USD)
 * @param amount - The amount to format
 * @param options - Optional Intl.NumberFormat options
 * @returns Formatted currency string (e.g., "$1,234.56")
 */
export function formatCurrency(
  amount: number | string | undefined, 
  options: Partial<Intl.NumberFormatOptions> = {}
): string {
  if (amount === undefined || amount === null) return '$0.00';
  
  // Convert string to number if needed
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Handle NaN
  if (isNaN(numericAmount)) return '$0.00';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options
  }).format(numericAmount);
}

/**
 * Format a date with a standardized format
 * @param date - Date to format (string, Date, or timestamp)
 * @param options - Optional Intl.DateTimeFormat options
 * @returns Formatted date string (e.g., "Jan 1, 2023")
 */
export function formatDate(
  date: string | Date | number | undefined,
  options: Partial<Intl.DateTimeFormatOptions> = {}
): string {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' 
      ? new Date(date) 
      : date;
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) return '';
    
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options
    }).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

/**
 * Format a percentage value
 * @param value - Value to format as percentage
 * @param decimalPlaces - Number of decimal places to show
 * @returns Formatted percentage string (e.g., "42.5%")
 */
export function formatPercentage(
  value: number | string | undefined,
  decimalPlaces: number = 1
): string {
  if (value === undefined || value === null) return '0%';
  
  // Convert string to number if needed
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Handle NaN
  if (isNaN(numericValue)) return '0%';
  
  return `${numericValue.toFixed(decimalPlaces)}%`;
}

/**
 * Format a phone number to standard US format
 * @param phone - Phone number to format
 * @returns Formatted phone number (e.g., "(123) 456-7890")
 */
export function formatPhoneNumber(phone: string | undefined): string {
  if (!phone) return '';
  
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format based on length
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 11)}`;
  }
  
  // Return original if we can't format it
  return phone;
}

/**
 * Truncate text to a specified length with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text || '';
  return `${text.slice(0, maxLength)}...`;
}
