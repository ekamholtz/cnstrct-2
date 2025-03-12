
import { supabase } from "@/integrations/supabase/client";
import { QBOService } from "@/integrations/qbo/qboService";

/**
 * Creates a payment for an expense in the database
 */
export const createPayment = async (paymentData: {
  expense_id: string;
  payment_method_code: string;
  payment_date: string;
  amount: number;
  notes?: string;
  direction: 'outgoing';
  status: 'completed';
}) => {
  console.log('Creating payment with data:', paymentData);
  
  if (!paymentData.expense_id) {
    throw new Error('Missing expense_id in payment data');
  }
  
  // Validate the expense exists before creating payment
  const { data: expense, error: expenseError } = await supabase
    .from('expenses')
    .select('id, amount, gc_account_id')
    .eq('id', paymentData.expense_id)
    .single();
    
  if (expenseError) {
    console.error('Error validating expense before payment:', expenseError);
    throw new Error(`Cannot create payment: ${expenseError.message}`);
  }
  
  if (!expense) {
    throw new Error(`Cannot create payment: Expense with ID ${paymentData.expense_id} not found`);
  }
  
  // Add gc_account_id to payment data
  const fullPaymentData = {
    ...paymentData,
    gc_account_id: expense.gc_account_id
  };
  
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert(fullPaymentData)
    .select()
    .single();

  if (paymentError) {
    console.error('Error creating payment:', paymentError);
    throw paymentError;
  }
  
  console.log('Payment created successfully:', payment);

  // Check if the expense is synced to QBO and sync the payment if needed
  try {
    const qboService = new QBOService();
    const connection = await qboService.getUserConnection();
    
    // Only attempt to sync if there's a QBO connection
    if (connection) {
      const expenseReference = await qboService.getEntityReference(
        paymentData.expense_id, 
        'expense'
      );
      
      // Only sync the payment if the expense is already synced
      if (expenseReference) {
        console.log('Expense is synced to QBO. Payment sync will be handled by the component.');
      }
    }
  } catch (error) {
    console.error('Error checking QBO sync status:', error);
    // We don't want to throw here and prevent payment creation
    // The sync will be attempted from the component
  }
  
  return payment;
};

/**
 * Creates a payment for an invoice in the database 
 */
export const createInvoicePayment = async (paymentData: {
  invoice_id: string;
  payment_method_code: string;
  payment_date: string;
  amount: number;
  notes?: string;
  direction: 'incoming';
  status: 'completed';
}) => {
  console.log('Creating invoice payment with data:', paymentData);
  
  if (!paymentData.invoice_id) {
    throw new Error('Missing invoice_id in payment data');
  }
  
  // Validate the invoice exists before creating payment
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('id, amount, gc_account_id')
    .eq('id', paymentData.invoice_id)
    .single();
    
  if (invoiceError) {
    console.error('Error validating invoice before payment:', invoiceError);
    throw new Error(`Cannot create payment: ${invoiceError.message}`);
  }
  
  if (!invoice) {
    throw new Error(`Cannot create payment: Invoice with ID ${paymentData.invoice_id} not found`);
  }
  
  // Add gc_account_id to payment data
  const fullPaymentData = {
    ...paymentData,
    gc_account_id: invoice.gc_account_id
  };
  
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert(fullPaymentData)
    .select()
    .single();

  if (paymentError) {
    console.error('Error creating invoice payment:', paymentError);
    throw paymentError;
  }
  
  console.log('Invoice payment created successfully:', payment);

  // Check if the invoice is synced to QBO
  try {
    const qboService = new QBOService();
    const connection = await qboService.getUserConnection();
    
    // Only attempt to sync if there's a QBO connection
    if (connection) {
      const invoiceReference = await qboService.getEntityReference(
        paymentData.invoice_id, 
        'invoice'
      );
      
      // Only sync the payment if the invoice is already synced
      if (invoiceReference) {
        console.log('Invoice is synced to QBO. Payment sync will be handled by the component.');
      }
    }
  } catch (error) {
    console.error('Error checking QBO sync status:', error);
    // We don't want to throw here and prevent payment creation
    // The sync will be attempted from the component
  }
  
  return payment;
};
