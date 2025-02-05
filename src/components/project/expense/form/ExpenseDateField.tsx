
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { ExpenseFormData } from "../types";

interface ExpenseDateFieldProps {
  form: UseFormReturn<ExpenseFormData>;
}

export function ExpenseDateField({ form }: ExpenseDateFieldProps) {
  return (
    <FormField
      control={form.control}
      name="expense_date"
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>Date</FormLabel>
          <FormControl>
            <Input
              placeholder="MM/DD/YYYY"
              {...field}
              value={field.value ? field.value : ''}
              onChange={(e) => {
                field.onChange(e.target.value);
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
