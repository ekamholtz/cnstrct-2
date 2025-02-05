
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { ExpenseFormData } from "../types";

interface ExpensePayeeFieldProps {
  form: UseFormReturn<ExpenseFormData>;
}

export function ExpensePayeeField({ form }: ExpensePayeeFieldProps) {
  return (
    <FormField
      control={form.control}
      name="payee"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Payee</FormLabel>
          <FormControl>
            <Input placeholder="Enter payee name" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
