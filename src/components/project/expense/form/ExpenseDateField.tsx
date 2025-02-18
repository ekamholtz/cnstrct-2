
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { ExpenseFormStage1Data } from "../types";

interface ExpenseDateFieldProps {
  form: UseFormReturn<ExpenseFormStage1Data>;
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
              type="date"
              {...field}
              value={field.value || ''}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
