
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useQBOService } from '@/integrations/qbo/hooks/useQBOService';
import { supabase } from '@/integrations/supabase/client';
import { useQBOMapper } from '@/integrations/qbo/hooks/useQBOMapper';
import { useMutation } from '@tanstack/react-query';

export interface PaymentData {
  id: string;
  amount: number;
  payment_date: string;
  payment_method_code: string;
  status: string;
  notes?: string;
  invoice_id?: string;
  expense_id?: string;
  invoices?: {
    id: string;
    projects: {
      client_id: string;
    }
  };
  expenses?: {
    id: string;
    vendor_id: string;
  };
}

/**
 * Hook for syncing payments to QuickBooks Online
 */
export const useSyncPaymentToQBO = () => {
  const { toast } = useToast();
  const qboService = useQBOService();
  const mapper = useQBOMapper();

  /**
   * Sync a payment to QuickBooks Online
   */
  const syncPaymentMutation = useMutation({
    mutationFn: async ({ 
      paymentId, 
      paymentType 
    }: { 
      paymentId: string; 
      paymentType: 'invoice_payment' | 'expense_payment' 
    }) => {
      console.log(`Syncing ${paymentType} to QBO:`, paymentId);
      
      // Check if the payment has already been synced
      const { data: existingRef } = await supabase
        .from('qbo_references')
        .select('qbo_id')
        .eq('entity_type', paymentType)
        .eq('entity_id', paymentId)
        .single();
      
      if (existingRef?.qbo_id) {
        console.log(`${paymentType} already synced to QBO with ID:`, existingRef.qbo_id);
        toast({
          title: 'Payment Already Synced',
          description: `This payment has already been synced to QuickBooks with ID: ${existingRef.qbo_id}`,
        });
        return {
          id: paymentId,
          qbo_sync_status: 'already_synced',
          qbo_entity_id: existingRef.qbo_id
        };
      }
      
      if (paymentType === 'invoice_payment') {
        // Handle invoice payment (money received)
        return await syncInvoicePayment(paymentId);
      } else {
        // Handle expense payment (money spent)
        return await syncExpensePayment(paymentId);
      }
    },
    onError: (error) => {
      console.error('Error syncing payment to QBO:', error);
      
      toast({
        title: 'Sync Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    }
  });

  /**
   * Sync an invoice payment (money received) to QuickBooks
   */
  const syncInvoicePayment = async (paymentId: string) => {
    // Fetch the payment with invoice details
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select(`
        *,
        invoices:invoice_id (
          *,
          projects:project_id (
            *,
            clients:client_id (*)
          )
        )
      `)
      .eq('id', paymentId)
      .single();
    
    if (paymentError || !payment) {
      throw new Error(`Failed to fetch payment: ${paymentError?.message || 'Payment not found'}`);
    }
    
    // Check if the related invoice has been synced to QBO
    const { data: invoiceRef } = await supabase
      .from('qbo_references')
      .select('qbo_id')
      .eq('entity_type', 'invoice')
      .eq('entity_id', payment.invoice_id)
      .single();
    
    if (!invoiceRef?.qbo_id) {
      throw new Error('Cannot sync payment: Invoice has not been synced to QuickBooks yet');
    }
    
    // Get the QBO customer ID for the client
    const { data: clientRef } = await supabase
      .from('qbo_references')
      .select('qbo_id')
      .eq('entity_type', 'client')
      .eq('entity_id', payment.invoices.projects.client_id)
      .single();
    
    if (!clientRef?.qbo_id) {
      throw new Error('Cannot sync payment: Client has not been synced to QuickBooks yet');
    }
    
    // Map the payment to QBO payment format
    const qboPaymentData = mapper.mapInvoicePaymentToPayment({
      invoiceId: invoiceRef.qbo_id,
      amount: payment.amount,
      date: new Date(payment.payment_date),
      paymentMethod: payment.payment_method_code || 'Check'
    });
    
    console.log('Mapped QBO payment data:', qboPaymentData);
    
    // Create the payment in QBO
    const result = await qboService.recordPayment(qboPaymentData);
    
    if (!result.success) {
      throw new Error(`Failed to create payment in QBO: ${result.error}`);
    }
    
    const qboPaymentId = result.data.Id;
    
    // Store the reference to the newly created payment
    await qboService.storeEntityReference('invoice_payment', paymentId, qboPaymentId);
    
    console.log('Successfully synced invoice payment to QBO with ID:', qboPaymentId);
    
    toast({
      title: 'Payment Synced',
      description: 'The payment has been successfully synced to QuickBooks',
    });
    
    return {
      id: paymentId,
      qbo_sync_status: 'synced',
      qbo_entity_id: qboPaymentId
    };
  };
  
  /**
   * Sync an expense payment (money spent) to QuickBooks
   */
  const syncExpensePayment = async (paymentId: string) => {
    // Fetch the payment with expense details
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select(`
        *,
        expenses:expense_id (
          *,
          vendor:vendor_id (*)
        )
      `)
      .eq('id', paymentId)
      .single();
    
    if (paymentError || !payment) {
      throw new Error(`Failed to fetch expense payment: ${paymentError?.message || 'Payment not found'}`);
    }
    
    // Check if the related expense has been synced to QBO
    const { data: expenseRef } = await supabase
      .from('qbo_references')
      .select('qbo_id')
      .eq('entity_type', 'expense')
      .eq('entity_id', payment.expense_id)
      .single();
    
    if (!expenseRef?.qbo_id) {
      throw new Error('Cannot sync payment: Expense has not been synced to QuickBooks yet');
    }
    
    // Get the QBO vendor ID
    const { data: vendorRef } = await supabase
      .from('qbo_references')
      .select('qbo_id')
      .eq('entity_type', 'vendor')
      .eq('entity_id', payment.expenses.vendor_id)
      .single();
    
    if (!vendorRef?.qbo_id) {
      throw new Error('Cannot sync payment: Vendor has not been synced to QuickBooks yet');
    }
    
    // Map the payment to QBO bill payment format
    const qboBillPaymentData = mapper.mapExpensePaymentToBillPayment({
      billId: expenseRef.qbo_id,
      amount: payment.amount,
      date: new Date(payment.payment_date),
      paymentMethod: payment.payment_method_code || 'Check'
    });
    
    console.log('Mapped QBO bill payment data:', qboBillPaymentData);
    
    // Create the bill payment in QBO
    const result = await qboService.recordBillPayment(qboBillPaymentData);
    
    if (!result.success) {
      throw new Error(`Failed to create bill payment in QBO: ${result.error}`);
    }
    
    const qboBillPaymentId = result.data.Id;
    
    // Store the reference to the newly created bill payment
    await qboService.storeEntityReference('expense_payment', paymentId, qboBillPaymentId);
    
    console.log('Successfully synced expense payment to QBO with ID:', qboBillPaymentId);
    
    toast({
      title: 'Expense Payment Synced',
      description: 'The expense payment has been successfully synced to QuickBooks',
    });
    
    return {
      id: paymentId,
      qbo_sync_status: 'synced',
      qbo_entity_id: qboBillPaymentId
    };
  };
  
  const syncPaymentToQBO = async (paymentId: string, paymentType: 'invoice_payment' | 'expense_payment') => {
    try {
      const result = await syncPaymentMutation.mutateAsync({ paymentId, paymentType });
      return result.qbo_entity_id;
    } catch (error) {
      return null;
    }
  };
  
  return {
    syncPaymentToQBO,
    isLoading: syncPaymentMutation.isPending
  };
};
