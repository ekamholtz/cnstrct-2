
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { PaymentDetailsData } from "../types";

interface PaymentAmountFieldProps {
  form: UseFormReturn<PaymentDetailsData>;
  expenseAmount: number;
}

export function PaymentAmountField({ form, expenseAmount }: PaymentAmountFieldProps) {
  return (
    <FormField
      control={form.control}
      name="payment_amount"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Payment Amount</FormLabel>
          <FormControl>
            <Input 
              type="number" 
              step="0.01" 
              min="0" 
              max={expenseAmount} 
              {...field} 
            />
          </FormControl>
          <FormDescription>
            Maximum amount: ${expenseAmount}
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
