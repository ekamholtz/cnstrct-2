// React Query v4+ compatibility layer
import { UseMutationResult, UseQueryResult } from "@tanstack/react-query";

/**
 * Compatibility wrapper for UseMutationResult to support both v3 and v4 versions of React Query
 * In v4, 'isLoading' was renamed to 'isPending'
 */
export type MutationResultCompat<TData = unknown, TError = unknown, TVariables = unknown, TContext = unknown> = 
  UseMutationResult<TData, TError, TVariables, TContext> & {
    // Include both properties for compatibility
    isLoading: boolean;
    isPending: boolean;
    status: 'idle' | 'loading' | 'success' | 'error' | 'pending';
  };

/**
 * Compatibility wrapper for UseQueryResult to support both v3 and v4 versions of React Query
 */
export type QueryResultCompat<TData = unknown, TError = unknown> = 
  UseQueryResult<TData, TError> & {
    // Any additional compatibility properties can be added here
  };

/**
 * Helper function to make mutation result compatible with both v3 and v4
 */
export function makeMutationCompatible<TData = unknown, TError = unknown, TVariables = unknown, TContext = unknown>(
  result: UseMutationResult<TData, TError, TVariables, TContext>
): MutationResultCompat<TData, TError, TVariables, TContext> {
  return {
    ...result,
    // In v4, isPending replaced isLoading
    isLoading: result.isPending,
  };
}
