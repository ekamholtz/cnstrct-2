
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useQBOService } from '@/integrations/qbo/hooks/useQBOService';
import { useAuth } from '@/hooks/useAuth';

export const useSyncExpenseToQBO = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { service: qboExpenseService } = useQBOService('bill');
  const { user } = useAuth();

  const syncExpenseToQBO = async (expenseId: string) => {
    try {
      setIsSyncing(true);
      setError(null);

      if (!qboExpenseService) {
        throw new Error('QBO expense service not available');
      }

      // Use type assertion to allow calling the method
      const result = await (qboExpenseService as any).syncExpenseToQBO(expenseId, user?.id || '');

      if (result?.success) {
        toast({
          title: 'Expense Synced to QBO',
          description: result.message || 'Expense was successfully synced to QuickBooks Online.',
        });
      } else {
        setError(result?.message || 'Failed to sync expense to QBO.');
        toast({
          title: 'Sync Failed',
          description: result?.message || 'Failed to sync expense to QuickBooks Online. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      console.error('Error syncing expense to QBO:', err);
      setError(err.message || 'Failed to sync expense to QBO.');
      toast({
        title: 'Sync Error',
        description: err.message || 'An error occurred while syncing the expense to QuickBooks Online.',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    isSyncing,
    error,
    syncExpenseToQBO,
  };
};
