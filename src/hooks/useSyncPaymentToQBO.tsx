
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
  const { service: qboPaymentService } = useQBOService('payment');
  const { user } = useAuth();

  const syncPaymentToQBO = async (paymentId: string) => {
    try {
      setIsSyncing(true);
      setError(null);

      if (!qboPaymentService) {
        throw new Error('QBO payment service not available');
      }

      // Use type assertion to call the method
      const result = await (qboPaymentService as any).syncPaymentToQBO(paymentId, user?.id || '');

      if (result && result.success) {
        setSuccess(true);
        toast({
          title: 'Payment Synced',
          description: 'Payment successfully synced to QuickBooks Online.',
        });
      } else {
        setError(result?.error || 'Failed to sync payment to QuickBooks Online.');
        toast({
          title: 'Sync Failed',
          description: result?.error || 'Failed to sync payment to QuickBooks Online.',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      console.error('Error syncing payment to QBO:', err);
      setError(err.message || 'Failed to sync payment to QuickBooks Online.');
      toast({
        title: 'Sync Error',
        description: err.message || 'Failed to sync payment to QuickBooks Online.',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const createQBOInvoicePayment = async (payment: Payment) => {
    try {
      setIsSyncing(true);
      setError(null);
      setSuccess(false);

      if (!qboPaymentService) {
        throw new Error('QuickBooks Online service is not available.');
      }

      // Create the payment in QBO
      const createResult = await (qboPaymentService as any).createQBOInvoicePayment(payment);

      if (createResult && createResult.success) {
        setSuccess(true);
        toast({
          title: 'Payment Created in QBO',
          description: 'Payment successfully created in QuickBooks Online.',
        });
      } else {
        setError(createResult?.error || 'Failed to create payment in QuickBooks Online.');
        toast({
          title: 'Creation Failed',
          description: createResult?.error || 'Failed to create payment in QuickBooks Online.',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      console.error('Error creating payment in QBO:', err);
      setError(err.message || 'Failed to create payment in QuickBooks Online.');
      toast({
        title: 'Creation Error',
        description: err.message || 'Failed to create payment in QuickBooks Online.',
        variant: 'destructive',
      });
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
