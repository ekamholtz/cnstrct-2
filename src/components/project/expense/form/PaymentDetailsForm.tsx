
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { PaymentDetailsData } from "../types";
import { PaymentTypeField } from "./PaymentTypeField";
import { PaymentDateField } from "./PaymentDateField";
import { PaymentAmountField } from "./PaymentAmountField";
import { useState } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { paymentDetailsSchema } from "../types";

interface PaymentDetailsFormProps {
  expenseAmount: number;
  amountDue: number;
  onSubmit: (data: PaymentDetailsData) => Promise<void>;
  onCancel: () => void;
}

export function PaymentDetailsForm({ expenseAmount, amountDue, onSubmit, onCancel }: PaymentDetailsFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const form = useForm<PaymentDetailsData>({
    resolver: zodResolver(paymentDetailsSchema),
    defaultValues: {
      payment_method_code: undefined,
      payment_date: new Date().toISOString().split('T')[0],
      amount: amountDue.toString(),
      notes: "",
    },
  });

  const handleSubmit = async (data: PaymentDetailsData) => {
    try {
      setIsProcessing(true);
      await onSubmit(data);
    } catch (error) {
      console.error("Error processing payment:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <PaymentTypeField form={form} />
        <PaymentDateField form={form} />
        <PaymentAmountField form={form} amountDue={amountDue} />
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reference/Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Optional: Enter payment reference number or notes"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isProcessing}
            className="bg-[#9b87f5] hover:bg-[#7E69AB]"
          >
            {isProcessing ? "Processing..." : "Submit Payment"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
