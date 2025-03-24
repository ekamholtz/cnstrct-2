import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { toast } from '@/components/ui/use-toast';

/**
 * Custom hook for data fetching with built-in error handling
 * Implements the hybrid state management approach by handling server state with React Query
 * while providing safe defaults and standardized error handling
 * 
 * @param queryKey - The key for the query (used for caching)
 * @param fetchFn - The function to fetch data
 * @param options - Additional react-query options
 * @param showErrorToast - Whether to automatically show error toasts
 */
export function useDataFetching<TData = any, TError = Error>(
  queryKey: unknown[],
  fetchFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, TError, TData>, 'queryKey' | 'queryFn'>,
  showErrorToast: boolean = true
) {
  const query = useQuery<TData, TError, TData>({
    queryKey,
    queryFn: async () => {
      try {
        return await fetchFn();
      } catch (error: any) {
        console.error(`Error fetching data for queryKey [${queryKey.join(', ')}]:`, error);
        
        // Show error toast if enabled
        if (showErrorToast) {
          toast({
            variant: 'destructive',
            title: 'Error loading data',
            description: error.message || 'An unexpected error occurred. Please try again later.',
          });
        }
        
        throw error;
      }
    },
    // Default retry behavior
    retry: (failureCount, error: any) => {
      // Don't retry on 401 (Unauthorized) or 403 (Forbidden)
      if (error.status === 401 || error.status === 403) {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
    // Customize with provided options
    ...options
  });

  return {
    // Ensure data is never undefined when used by components
    data: query.data || ([] as unknown as TData),
    error: query.error,
    isLoading: query.isLoading,
    isError: query.isError,
    isSuccess: query.isSuccess,
    isFetching: query.isFetching,
    refetch: query.refetch,
    // Original query object for advanced use cases
    query
  };
}

/**
 * Hook for paginated data fetching with built-in error handling
 * Handles common pagination patterns in the application
 */
export function usePaginatedData<TData = any, TError = Error>(
  queryKey: unknown[],
  fetchFn: (page: number, pageSize: number) => Promise<{ data: TData[], totalCount: number }>,
  initialPage: number = 1,
  initialPageSize: number = 10,
  options?: Omit<UseQueryOptions<{ data: TData[], totalCount: number }, TError, { data: TData[], totalCount: number }>, 'queryKey' | 'queryFn'>
) {
  const query = useDataFetching<{ data: TData[], totalCount: number }, TError>(
    [...queryKey, initialPage, initialPageSize],
    () => fetchFn(initialPage, initialPageSize),
    options
  );

  return {
    // Provide safe defaults
    data: query.data?.data || [],
    totalCount: query.data?.totalCount || 0,
    currentPage: initialPage,
    pageSize: initialPageSize,
    ...query
  };
}
