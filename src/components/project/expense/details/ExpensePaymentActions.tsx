import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Expense, PaymentDetailsData } from "../types";
import { PaymentDetailsForm } from "../form/PaymentDetailsForm";
import { PaymentSimulationForm } from "../form/PaymentSimulationForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ExpensePaymentActionsProps {
  expense: Expense;
  showActions: boolean;
  disableActions?: boolean;
}

// Direct API call to create a payment without using hooks
async function createPayment(expenseId: string, paymentDetails: PaymentDetailsData) {
  try {
    console.log('Creating payment for expense:', expenseId);
    console.log('Payment details:', paymentDetails);
    
    // Convert amount from string to number for the API
    const paymentAmount = parseFloat(paymentDetails.amount);
    
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      throw new Error('Invalid payment amount');
    }
    
    // First get the expense to get its gc_account_id
    const { data: expense, error: expenseError } = await supabase
      .from('expenses')
      .select('gc_account_id')
      .eq('id', expenseId)
      .single();

    if (expenseError) {
      console.error('Error fetching expense for payment:', expenseError);
      throw expenseError;
    }

    if (!expense || !expense.gc_account_id) {
      throw new Error('Expense not found or missing gc_account_id');
    }
    
    // Create the payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        expense_id: expenseId,
        gc_account_id: expense.gc_account_id,
        payment_method_code: paymentDetails.payment_method_code,
        payment_date: paymentDetails.payment_date,
        amount: paymentAmount,
        notes: paymentDetails.notes || '',
        direction: 'outgoing',
        status: 'completed',
        simulation_mode: false
      })
      .select()
      .single();
    
    if (paymentError) {
      console.error('Error creating payment:', paymentError);
      throw paymentError;
    }
    
    // Update the expense payment status
    const { data: currentExpense, error: fetchError } = await supabase
      .from('expenses')
      .select('amount, amount_due')
      .eq('id', expenseId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching expense details:', fetchError);
      throw fetchError;
    }
    
    const totalAmount = currentExpense.amount || 0;
    const previousAmountDue = currentExpense.amount_due || totalAmount;
    const newAmountDue = Math.max(0, previousAmountDue - paymentAmount);
    const paymentStatus = newAmountDue <= 0 ? 'paid' : 
                          newAmountDue < totalAmount ? 'partially_paid' : 'due';
    
    const { error: updateError } = await supabase
      .from('expenses')
      .update({
        amount_due: newAmountDue,
        payment_status: paymentStatus
      })
      .eq('id', expenseId);
    
    if (updateError) {
      console.error('Error updating expense after payment:', updateError);
      throw updateError;
    }
    
    return payment;
  } catch (error) {
    console.error('Error in createPayment:', error);
    throw error;
  }
}

export function ExpensePaymentActions({ 
  expense, 
  showActions = true,
  disableActions = false 
}: ExpensePaymentActionsProps) {
  // Basic state for dialogs
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [showPaymentSimulation, setShowPaymentSimulation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // If showActions is false, don't render anything
  if (!showActions) {
    return null;
  }

  // Safely calculate amounts with fallbacks
  const expenseAmount = typeof expense?.amount === 'number' ? expense.amount : 0;
  const amountDue = typeof expense?.amount_due === 'number' ? expense.amount_due : expenseAmount;

  // Determine if buttons should be disabled
  const buttonsDisabled = isSubmitting || disableActions;

  // Direct payment submission handler
  const handlePaymentSubmit = async (data: PaymentDetailsData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      if (!expense?.id) {
        throw new Error('Expense ID is missing');
      }
      
      // Create payment directly using our adapter function
      await createPayment(expense.id, data);
      
      // Show success toast
      toast({
        title: "Payment recorded",
        description: `Payment of $${parseFloat(data.amount).toFixed(2)} has been recorded.`,
      });
      
      // Close the dialog on success
      setShowPaymentDetails(false);
      
      // Reload the page to show updated data
      window.location.reload();
    } catch (err) {
      console.error('Error processing payment:', err);
      setError(err instanceof Error ? err.message : 'Failed to process payment');
      
      toast({
        title: "Payment failed",
        description: err instanceof Error ? err.message : 'Failed to process payment',
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Direct payment simulation handler
  const handlePaymentSimulation = async (data: { 
    payment_amount: string;
    payee_email?: string;
    payee_phone?: string;
  }) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      if (!expense?.id) {
        throw new Error('Expense ID is missing');
      }
      
      // Create payment details object
      const paymentDetails: PaymentDetailsData = {
        payment_method_code: 'transfer',
        payment_date: new Date().toISOString().split('T')[0],
        amount: data.payment_amount,
        notes: `Payment to ${data.payee_email || expense.payee || 'payee'}`
      };
      
      // Create payment directly using our adapter function
      await createPayment(expense.id, paymentDetails);
      
      // Show success toast
      toast({
        title: "Payment processed",
        description: `Payment of $${parseFloat(data.payment_amount).toFixed(2)} has been processed.`,
      });
      
      // Close the dialog on success
      setShowPaymentSimulation(false);
      
      // Reload the page to show updated data
      window.location.reload();
    } catch (err) {
      console.error('Error simulating payment:', err);
      setError(err instanceof Error ? err.message : 'Failed to simulate payment');
      
      toast({
        title: "Payment failed",
        description: err instanceof Error ? err.message : 'Failed to simulate payment',
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          Error: {error}
        </div>
      )}
      
      {disableActions && (
        <div className="p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm mb-2">
          This expense has been fully paid.
        </div>
      )}
      
      <div className="flex gap-4">
        <Button 
          variant="outline"
          onClick={() => setShowPaymentDetails(true)}
          disabled={buttonsDisabled}
        >
          Mark as Paid
        </Button>
        
        <Button 
          className="bg-[#9b87f5] hover:bg-[#7E69AB]"
          onClick={() => setShowPaymentSimulation(true)}
          disabled={buttonsDisabled}
        >
          Pay Now
        </Button>
      </div>

      {showPaymentDetails && (
        <Dialog open={showPaymentDetails} onOpenChange={setShowPaymentDetails}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enter Payment Details</DialogTitle>
            </DialogHeader>
            <PaymentDetailsForm
              expenseAmount={expenseAmount}
              amountDue={amountDue}
              onSubmit={handlePaymentSubmit}
              onCancel={() => setShowPaymentDetails(false)}
              isSubmitting={isSubmitting}
            />
          </DialogContent>
        </Dialog>
      )}

      {showPaymentSimulation && (
        <Dialog open={showPaymentSimulation} onOpenChange={setShowPaymentSimulation}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Payment Simulation</DialogTitle>
            </DialogHeader>
            <PaymentSimulationForm
              initialPayee={expense?.payee || ''}
              initialAmount={amountDue.toString()}
              onSubmit={handlePaymentSimulation}
              onCancel={() => setShowPaymentSimulation(false)}
              isSubmitting={isSubmitting}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
