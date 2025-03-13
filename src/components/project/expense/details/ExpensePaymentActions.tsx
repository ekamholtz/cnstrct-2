
import React from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export interface ExpensePaymentActionsProps {
  expense: any;
  onAddPayment: () => void;
}

export function ExpensePaymentActions({ 
  expense, 
  onAddPayment 
}: ExpensePaymentActionsProps) {
  // Check if expense is fully paid
  const isFullyPaid = expense.status === 'paid';
  
  if (isFullyPaid) {
    return null;
  }
  
  return (
    <div className="mt-4 flex justify-end">
      <Button 
        variant="outline" 
        onClick={onAddPayment}
        className="flex items-center"
      >
        <PlusCircle className="h-4 w-4 mr-2" />
        Record Payment
      </Button>
    </div>
  );
}
