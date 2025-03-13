import { useToast } from '@/components/ui/use-toast';
import { useQBOService } from '@/integrations/qbo/hooks/useQBOService';
import { supabase } from '@/integrations/supabase/client';
import { useQBOMapper } from '@/integrations/qbo/hooks/useQBOMapper';
import { useMutation } from '@tanstack/react-query';

export interface ExpenseData {
  id: string;
  name: string;
  expense_date: string;
  amount: number;
  expense_type: string;
  vendor_name: string;
  project_id: string;
  notes?: string;
  vendor_id?: string;
  vendor?: {
    id: string;
    name: string;
    company_name?: string;
    email?: string;
    phone?: string;
  };
  projects?: {
    id: string;
    name: string;
    clients?: {
      id: string;
      name: string;
    };
  };
}

/**
 * Hook for syncing expenses to QuickBooks Online as bills
 */
export const useSyncExpenseToQBO = () => {
  const { toast } = useToast();
  const qboService = useQBOService();
  const mapper = useQBOMapper();

  /**
   * Sync an expense to QuickBooks Online as a bill
   */
  const syncExpenseMutation = useMutation({
    mutationFn: async (expenseId: string) => {
      console.log('Syncing expense to QBO:', expenseId);
      
      // Fetch the expense with project and vendor details
      const { data: expense, error: expenseError } = await supabase
        .from('expenses')
        .select(`
          *,
          projects:project_id (
            *,
            clients:client_id (*)
          ),
          vendor:vendor_id (*)
        `)
        .eq('id', expenseId)
        .single();
      
      if (expenseError || !expense) {
        throw new Error(`Failed to fetch expense: ${expenseError?.message || 'Expense not found'}`);
      }
      
      // Check if the expense has already been synced
      const { data: existingRef } = await supabase
        .from('qbo_references')
        .select('qbo_id')
        .eq('entity_type', 'expense')
        .eq('entity_id', expenseId)
        .single();
      
      if (existingRef?.qbo_id) {
        console.log('Expense already synced to QBO with ID:', existingRef.qbo_id);
        toast({
          title: 'Expense Already Synced',
          description: `This expense has already been synced to QuickBooks with ID: ${existingRef.qbo_id}`,
        });
        return {
          ...expense,
          qbo_sync_status: 'already_synced',
          qbo_entity_id: existingRef.qbo_id
        };
      }
      
      // Get the QBO vendor ID for the vendor
      let vendorQBOId;
      
      if (expense.vendor_id) {
        const { data: vendorRef } = await supabase
          .from('qbo_references')
          .select('qbo_id')
          .eq('entity_type', 'vendor')
          .eq('entity_id', expense.vendor_id)
          .single();
        
        if (!vendorRef?.qbo_id) {
          // If the vendor isn't synced yet, we need to sync them first
          const vendorData = {
            DisplayName: expense.vendor.name,
            CompanyName: expense.vendor.company_name || expense.vendor.name,
            PrimaryEmailAddr: {
              Address: expense.vendor.email || ''
            },
            PrimaryPhone: {
              FreeFormNumber: expense.vendor.phone || ''
            }
          };
          
          const vendorResult = await qboService.createVendor(vendorData);
          
          if (!vendorResult.success) {
            throw new Error(`Failed to create vendor in QBO: ${vendorResult.error}`);
          }
          
          // Store the reference to the newly created vendor
          await qboService.storeEntityReference(
            'vendor', 
            expense.vendor_id, 
            vendorResult.data.Id
          );
          
          vendorQBOId = vendorResult.data.Id;
        } else {
          vendorQBOId = vendorRef.qbo_id;
        }
      } else {
        // If no vendor is specified, use a default vendor or account
        vendorQBOId = '1'; // This should be configured or fetched from settings
      }
      
      // Get the expense account ID (using a default if not configured)
      const expenseAccountId = '1'; // This should be configured or fetched from settings
      
      // Map the expense to QBO bill format
      const qboBillData = mapper.mapExpenseToBill(
        expense,
        vendorQBOId,
        expenseAccountId
      );
      
      console.log('Mapped QBO bill data:', qboBillData);
      
      // Create the bill in QBO
      const result = await qboService.createBill(qboBillData);
      
      if (!result.success) {
        throw new Error(`Failed to create bill in QBO: ${result.error}`);
      }
      
      const qboBillId = result.data.Id;
      
      // Store the reference to the newly created bill
      await qboService.storeEntityReference('expense', expenseId, qboBillId);
      
      console.log('Successfully synced expense to QBO with ID:', qboBillId);
      
      toast({
        title: 'Expense Synced',
        description: 'The expense has been successfully synced to QuickBooks as a bill',
      });
      
      return {
        ...expense,
        qbo_sync_status: 'synced',
        qbo_entity_id: qboBillId
      };
    },
    onError: (error) => {
      console.error('Error syncing expense to QBO:', error);
      
      toast({
        title: 'Sync Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    }
  });
  
  const syncExpenseToQBO = async (expenseId: string) => {
    try {
      const result = await syncExpenseMutation.mutateAsync(expenseId);
      return result.qbo_entity_id;
    } catch (error) {
      return null;
    }
  };
  
  return {
    syncExpenseToQBO,
    isLoading: syncExpenseMutation.isPending
  };
};
