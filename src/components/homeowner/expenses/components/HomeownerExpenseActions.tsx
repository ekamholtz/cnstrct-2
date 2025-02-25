
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { HomeownerExpense, PaymentDetailsData } from "../types";
import { PaymentDetailsForm } from "./PaymentDetailsForm";
import { PaymentSimulationForm } from "./PaymentSimulationForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface HomeownerExpenseActionsProps {
  expense: HomeownerExpense;
  onPaymentSubmit: (paymentData: PaymentDetailsData) => Promise<void>;
  onPaymentSimulate: (data: { 
    payment_amount: string;
    payee_email?: string;
    payee_phone?: string;
  }) => Promise<void>;
}

export function HomeownerExpenseActions({ 
  expense, 
  onPaymentSubmit,
  onPaymentSimulate 
}: HomeownerExpenseActionsProps) {
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [showPaymentSimulation, setShowPaymentSimulation] = useState(false);

  // Don't show actions if the expense is fully paid
  if (expense.payment_status === 'paid') return null;

  return (
    <div className="flex gap-4">
      <Button 
        variant="outline"
        onClick={() => setShowPaymentDetails(true)}
      >
        Mark as Paid
      </Button>
      
      <Button 
        className="bg-[#9b87f5] hover:bg-[#7E69AB]"
        onClick={() => setShowPaymentSimulation(true)}
      >
        Pay Now
      </Button>

      <Dialog open={showPaymentDetails} onOpenChange={setShowPaymentDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Payment Details</DialogTitle>
          </DialogHeader>
          <PaymentDetailsForm
            expenseAmount={expense.amount}
            amountDue={expense.amount_due}
            onSubmit={onPaymentSubmit}
            onCancel={() => setShowPaymentDetails(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showPaymentSimulation} onOpenChange={setShowPaymentSimulation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment Simulation</DialogTitle>
          </DialogHeader>
          <PaymentSimulationForm
            initialPayee={expense.payee}
            initialAmount={expense.amount_due.toString()}
            onSubmit={onPaymentSimulate}
            onCancel={() => setShowPaymentSimulation(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
