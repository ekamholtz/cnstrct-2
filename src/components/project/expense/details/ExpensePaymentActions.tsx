
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Expense, Payment, PaymentDetailsData } from "../types";
import { PaymentDetailsForm } from "../form/PaymentDetailsForm";
import { PaymentSimulationForm } from "../form/PaymentSimulationForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useExpenses } from "../hooks/useExpenses";

interface ExpensePaymentActionsProps {
  expense: Expense & { 
    project: { name: string };
    payments: Payment[];
  };
  showActions: boolean;
}

export function ExpensePaymentActions({ expense, showActions }: ExpensePaymentActionsProps) {
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [showPaymentSimulation, setShowPaymentSimulation] = useState(false);
  const { createPayment } = useExpenses(expense.project_id);

  if (!showActions) return null;

  const handlePaymentSubmit = async (data: PaymentDetailsData) => {
    await createPayment({
      expenseId: expense.id,
      paymentData: data
    });
    setShowPaymentDetails(false);
  };

  const handlePaymentSimulation = async (data: { 
    payment_amount: string;
    payee_email?: string;
    payee_phone?: string;
  }) => {
    await createPayment({
      expenseId: expense.id,
      paymentData: {
        payment_type: 'transfer',
        payment_date: new Date().toISOString().split('T')[0],
        payment_amount: data.payment_amount,
        vendor_email: data.payee_email,
        vendor_phone: data.payee_phone
      } as PaymentDetailsData
    });
    setShowPaymentSimulation(false);
  };

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
            onSubmit={handlePaymentSubmit}
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
            onSubmit={handlePaymentSimulation}
            onCancel={() => setShowPaymentSimulation(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
