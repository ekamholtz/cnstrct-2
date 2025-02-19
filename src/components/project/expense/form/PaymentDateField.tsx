
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { PaymentDetailsData } from "../types";

interface PaymentDateFieldProps {
  form: UseFormReturn<PaymentDetailsData>;
}

export function PaymentDateField({ form }: PaymentDateFieldProps) {
  return (
    <FormField
      control={form.control}
      name="payment_date"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Payment Date</FormLabel>
          <FormControl>
            <Input type="date" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
