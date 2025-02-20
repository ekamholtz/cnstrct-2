
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Invoice } from "./types";
import { supabase } from "@/integrations/supabase/client";

interface PaymentSimulationModalProps {
  invoice: Invoice;
  onPaymentComplete: () => void;
}

export function PaymentSimulationModal({ invoice, onPaymentComplete }: PaymentSimulationModalProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSimulatePayment = async () => {
    console.log('Validating invoice data:', invoice);
    
    if (!invoice?.id || !invoice?.amount || !invoice?.invoice_number) {
      console.error('Invalid invoice data:', {
        id: invoice?.id,
        amount: invoice?.amount,
        invoice_number: invoice?.invoice_number
      });
      toast({
        variant: "destructive",
        title: "Error",
        description: "Invalid invoice data. Please try again.",
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('Starting payment simulation for invoice:', {
        id: invoice.id,
        amount: invoice.amount,
        invoice_number: invoice.invoice_number
      });
      
      const simulationDetails = {
        simulated_at: new Date().toISOString(),
        amount: invoice.amount,
        invoice_number: invoice.invoice_number
      };

      console.log('Calling simulate_invoice_payment with:', {
        invoice_id: invoice.id,
        simulation_details: simulationDetails
      });

      // Call the RPC function
      const { data, error } = await supabase
        .rpc('simulate_invoice_payment', {
          invoice_id: invoice.id,
          simulation_details: simulationDetails
        });

      if (error) {
        console.error('Payment simulation error:', error);
        throw error;
      }

      console.log('Payment simulation completed successfully:', data);

      toast({
        title: "Payment Successful",
        description: "Your payment has been processed successfully.",
      });
      
      setOpen(false);
      onPaymentComplete();
    } catch (error) {
      console.error('Payment simulation error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was an error processing your payment. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          Pay Invoice
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Payment</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Invoice Number:</span>
                <span className="font-medium">{invoice?.invoice_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium">${invoice?.amount?.toLocaleString()}</span>
              </div>
            </div>
            <p className="text-yellow-600 bg-yellow-50 p-3 rounded text-sm">
              Note: This is a simulated payment for demonstration purposes.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <Button 
            onClick={handleSimulatePayment} 
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? "Processing..." : "Confirm Payment"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
