
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { PaymentDetailsData } from "../types";

interface PaymentAmountFieldProps {
  form: UseFormReturn<PaymentDetailsData>;
  amountDue: number;
}

export function PaymentAmountField({ form, amountDue }: PaymentAmountFieldProps) {
  return (
    <FormField
      control={form.control}
      name="amount"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Payment Amount</FormLabel>
          <FormControl>
            <Input 
              type="number" 
              step="0.01" 
              min="0" 
              max={amountDue} 
              {...field} 
            />
          </FormControl>
          <FormDescription>
            Maximum amount: ${amountDue}
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
