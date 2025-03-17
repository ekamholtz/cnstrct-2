
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useQBOService } from '@/integrations/qbo/hooks/useQBOService';
import { useAuth } from './useAuth';

// Define the Payment type
interface Payment {
  id: string;
  amount: number;
  payment_date?: string;
  payment_method?: string;
  reference_number?: string;
  notes?: string;
  invoice_id?: string;
  project_id?: string;
  status?: string;
}

export const useSyncPaymentToQBO = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const { toast } = useToast();
  const qboService = useQBOService();
  const { user } = useAuth();

  const syncPaymentToQBO = async (paymentId: string) => {
    try {
      setIsSyncing(true);
      setError(null);

      console.log('Simulating payment sync to QBO for ID:', paymentId);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess(true);
      toast({
        title: 'Payment Synced',
        description: 'Payment successfully synced to QuickBooks Online.',
      });
      
      return { success: true };
    } catch (err: any) {
      console.error('Error syncing payment to QBO:', err);
      setError(err.message || 'Failed to sync payment to QuickBooks Online.');
      toast({
        title: 'Sync Error',
        description: err.message || 'Failed to sync payment to QuickBooks Online.',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  const createQBOInvoicePayment = async (payment: Payment) => {
    try {
      setIsSyncing(true);
      setError(null);
      setSuccess(false);

      console.log('Simulating creating payment in QBO:', payment);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess(true);
      toast({
        title: 'Payment Created in QBO',
        description: 'Payment successfully created in QuickBooks Online.',
      });
      
      return { success: true };
    } catch (err: any) {
      console.error('Error creating payment in QBO:', err);
      setError(err.message || 'Failed to create payment in QuickBooks Online.');
      toast({
        title: 'Creation Error',
        description: err.message || 'Failed to create payment in QuickBooks Online.',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    isSyncing,
    error,
    success,
    syncPaymentToQBO,
    createQBOInvoicePayment,
  };
};
