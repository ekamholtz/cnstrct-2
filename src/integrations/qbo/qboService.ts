
/**
 * This file is DEPRECATED and should not be used directly.
 * It now re-exports everything from qboServiceProxy.ts to ensure
 * legacy imports don't cause issues.
 * 
 * IMPORTANT: All new code should import from qboServiceProxy.ts
 */

console.warn(
  "DEPRECATED: You are importing QBOService from qboService.ts. " +
  "This is deprecated and should not be used directly. " +
  "Please update your imports to use qboServiceProxy.ts instead."
);

// Re-export everything from the proxy version
export * from './qboServiceProxy';

// Legacy code that directly imports this file will now use the new Edge Function implementation

