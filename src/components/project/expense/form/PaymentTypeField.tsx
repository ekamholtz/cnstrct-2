
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { PaymentDetailsData } from "../types";

interface PaymentTypeFieldProps {
  form: UseFormReturn<PaymentDetailsData>;
}

export function PaymentTypeField({ form }: PaymentTypeFieldProps) {
  return (
    <FormField
      control={form.control}
      name="payment_method_code"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Payment Method</FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="cc">Credit Card</SelectItem>
              <SelectItem value="check">Check</SelectItem>
              <SelectItem value="transfer">Transfer</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
